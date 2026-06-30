'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import type { Report, ClusterGroup, Status } from '@/lib/types'
import { CATEGORY_ICONS, CATEGORY_LABELS, SEVERITY_COLORS, STATUS_LABELS, STATUS_NEXT } from '@/lib/types'
import SeverityIndicator from './SeverityIndicator'
import StatusBadge from './StatusBadge'

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 }

// ── Cluster grouping logic ─────────────────────────────────────────────────────
function groupIntoClusters(reports: Report[]): ClusterGroup[] {
  const clusterMap: Record<string, Report[]> = {}

  for (const r of reports) {
    const key = r.cluster_id ?? r.id
    if (!clusterMap[key]) clusterMap[key] = []
    clusterMap[key].push(r)
  }

  const groups: ClusterGroup[] = []
  for (const clusterId of Object.keys(clusterMap)) {
    const members = clusterMap[clusterId]
    // Root = the member that IS the cluster root (cluster_id === null && id === clusterId)
    // or just the first member sorted by created_at
    const root =
      members.find((r) => r.id === clusterId && r.cluster_id === null) ??
      members.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]

    const totalConfirmations = members.reduce((sum, r) => sum + (r.verification_count ?? 0), 0)
    // At minimum show the member count itself
    const confirmations = Math.max(members.length, totalConfirmations)

    groups.push({ clusterId, root, confirmations })
  }

  return groups
}

// ── Marker color by severity ───────────────────────────────────────────────────
function markerColor(severity: string): string {
  return SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] ?? '#888'
}

// ── InfoWindow content ─────────────────────────────────────────────────────────
function ClusterInfoWindow({
  group,
  onStatusChange,
  onClose,
}: {
  group: ClusterGroup
  onStatusChange: (id: string, status: Status) => void
  onClose: () => void
}) {
  const { root, confirmations } = group
  const nextStatus = STATUS_NEXT[root.status]
  const [updating, setUpdating] = useState(false)

  const handleStatusChange = async () => {
    if (!nextStatus) return
    setUpdating(true)
    try {
      const res = await fetch('/api/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: root.id, status: nextStatus }),
      })
      if (res.ok) {
        onStatusChange(root.id, nextStatus)
      }
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="info-panel" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--color-asphalt-mid)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span className="category-tag" style={{ fontSize: '0.6875rem' }}>
              {CATEGORY_ICONS[root.category]} {CATEGORY_LABELS[root.category]}
            </span>
            <SeverityIndicator severity={root.severity} size="sm" />
          </div>
          {confirmations > 1 && (
            <div style={{ marginTop: '0.375rem' }}>
              <span className="verify-count">
                🔗 {confirmations} confirmations
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-paper-dark)',
            cursor: 'pointer',
            padding: '0.125rem',
            lineHeight: 1,
            fontSize: '1.25rem',
            flexShrink: 0,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Photo */}
      {root.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={root.image_url}
          alt={CATEGORY_LABELS[root.category]}
          style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* Body */}
      <div style={{ padding: '0.75rem 1rem' }}>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-paper)',
            margin: '0 0 0.75rem',
            lineHeight: 1.5,
          }}
        >
          {root.description}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <StatusBadge status={root.status} size="sm" />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.625rem',
              color: 'var(--color-paper-dark)',
            }}
          >
            {new Date(root.created_at).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Status action */}
      {nextStatus && (
        <div
          style={{
            padding: '0.5rem 1rem 0.75rem',
            borderTop: '1px solid var(--color-asphalt-mid)',
          }}
        >
          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '0.5rem 1rem' }}
            onClick={handleStatusChange}
            disabled={updating}
            id={`status-btn-${root.id}`}
          >
            {updating ? (
              <><span className="spinner" /> Updating…</>
            ) : (
              <>Mark as {STATUS_LABELS[nextStatus]}</>
            )}
          </button>
        </div>
      )}

      {/* ID footer */}
      <div
        style={{
          padding: '0.375rem 1rem',
          borderTop: '1px solid var(--color-asphalt-mid)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.5625rem',
          color: 'var(--color-paper-dark)',
          letterSpacing: '0.05em',
        }}
      >
        #{root.id.slice(0, 8).toUpperCase()} · {root.lat.toFixed(4)}, {root.lng.toFixed(4)}
      </div>
    </div>
  )
}

// ── Map markers layer ──────────────────────────────────────────────────────────
function MarkersLayer({
  clusters,
  selectedId,
  onSelect,
  onStatusChange,
}: {
  clusters: ClusterGroup[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onStatusChange: (id: string, status: Status) => void
}) {
  const selected = clusters.find((c) => c.clusterId === selectedId) ?? null

  return (
    <>
      {clusters.map((group) => {
        const { root, confirmations, clusterId } = group
        const color = markerColor(root.severity)
        const isSelected = clusterId === selectedId
        const showCount = confirmations > 1

        return (
          <AdvancedMarker
            key={clusterId}
            position={{ lat: root.lat, lng: root.lng }}
            title={`${CATEGORY_LABELS[root.category]} — ${root.severity} severity`}
            onClick={() => onSelect(isSelected ? null : clusterId)}
          >
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              {/* Pin */}
              <div
                style={{
                  width: isSelected ? 36 : 28,
                  height: isSelected ? 36 : 28,
                  background: color,
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  border: `2px solid ${isSelected ? '#fff' : 'rgba(28,27,25,0.9)'}`,
                  boxShadow: isSelected
                    ? `0 0 0 3px ${color}44, 0 4px 16px rgba(0,0,0,0.5)`
                    : '0 2px 8px rgba(0,0,0,0.4)',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    transform: 'rotate(45deg)',
                    fontSize: isSelected ? '14px' : '11px',
                    lineHeight: 1,
                  }}
                >
                  {CATEGORY_ICONS[root.category]}
                </span>
              </div>

              {/* Count badge */}
              {showCount && (
                <div
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -10,
                    transform: 'none',
                    background: 'var(--color-orange)',
                    color: 'white',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '9px',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid var(--color-asphalt)',
                    zIndex: 1,
                  }}
                >
                  {confirmations > 9 ? '9+' : confirmations}
                </div>
              )}
            </div>
          </AdvancedMarker>
        )
      })}

      {/* InfoWindow for selected cluster */}
      {selected && (
        <InfoWindow
          position={{ lat: selected.root.lat, lng: selected.root.lng }}
          onCloseClick={() => onSelect(null)}
          pixelOffset={[0, -20]}
          disableAutoPan={false}
        >
          <ClusterInfoWindow
            group={selected}
            onStatusChange={onStatusChange}
            onClose={() => onSelect(null)}
          />
        </InfoWindow>
      )}
    </>
  )
}

// ── Main MapView ───────────────────────────────────────────────────────────────
interface MapViewProps {
  initialReports?: Report[]
}

export default function MapView({ initialReports = [] }: MapViewProps) {
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [clusters, setClusters] = useState<ClusterGroup[]>([])
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  const [liveCount, setLiveCount] = useState(0)
  const supabaseRef = useRef(getSupabaseBrowserClient())

  // Re-cluster when reports change
  useEffect(() => {
    setClusters(groupIntoClusters(reports))
  }, [reports])

  // Center on user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silent fallback to default center
      )
    }
  }, [])

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = supabaseRef.current
    const channel = supabase
      .channel('reports-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => {
          const newReport = payload.new as Report
          setReports((prev) => [newReport, ...prev])
          setLiveCount((n) => n + 1)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reports' },
        (payload) => {
          const updated = payload.new as Report
          setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleStatusChange = useCallback((id: string, status: Status) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }, [])

  const statusCounts = {
    reported: reports.filter((r) => r.status === 'reported').length,
    verified: reports.filter((r) => r.status === 'verified').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Stats bar */}
      <div
        style={{
          background: 'var(--color-asphalt-light)',
          borderBottom: '1px solid var(--color-asphalt-mid)',
          padding: '0.5rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span className="live-dot" />
          <span style={{ color: 'var(--color-paper-dim)' }}>LIVE</span>
          {liveCount > 0 && (
            <span style={{ color: 'var(--color-orange)' }}>+{liveCount} new</span>
          )}
        </div>
        <span style={{ color: 'var(--color-paper-dark)' }}>
          {clusters.length} unique issues
        </span>
        <span style={{ color: 'var(--color-status-reported)' }}>
          {statusCounts.reported} reported
        </span>
        <span style={{ color: 'var(--color-status-verified)' }}>
          {statusCounts.verified} verified
        </span>
        <span style={{ color: 'var(--color-status-resolved)' }}>
          {statusCounts.resolved} resolved
        </span>

        {/* Legend */}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            color: 'var(--color-paper-dark)',
          }}
        >
          {(['low', 'medium', 'high'] as const).map((sev) => (
            <span key={sev} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: SEVERITY_COLORS[sev],
                }}
              />
              {sev}
            </span>
          ))}
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {reports.length === 0 && (
          <div
            className="empty-state"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              background: 'rgba(28,27,25,0.7)',
              pointerEvents: 'none',
            }}
          >
            <span className="empty-state-icon">🗺️</span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                letterSpacing: '0.06em',
              }}
            >
              No Reports Yet
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>
              Be the first to report an issue in your area.
            </p>
          </div>
        )}

        <APIProvider apiKey={MAPS_API_KEY}>
          <Map
            defaultCenter={mapCenter}
            center={mapCenter}
            defaultZoom={13}
            mapId="community-hero-map"
            colorScheme="DARK"
            disableDefaultUI={false}
            gestureHandling="greedy"
            style={{ width: '100%', height: '100%' }}
            onCameraChanged={(ev) => setMapCenter(ev.detail.center)}
          >
            <MarkersLayer
              clusters={clusters}
              selectedId={selectedClusterId}
              onSelect={setSelectedClusterId}
              onStatusChange={handleStatusChange}
            />
          </Map>
        </APIProvider>
      </div>
    </div>
  )
}
