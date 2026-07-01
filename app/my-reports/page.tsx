'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import type { Report, Category, Severity, Status } from '@/lib/types'
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_NEXT,
} from '@/lib/types'
import SeverityIndicator from '../components/SeverityIndicator'
import StatusBadge from '../components/StatusBadge'
import NavBar from '../components/NavBar'
import { ArrowUpDown } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'

type SortKey = 'created_at' | 'severity' | 'status' | 'verification_count'
const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 }
const STATUS_ORDER: Record<Status, number> = { reported: 0, verified: 1, resolved: 2 }

function sortReports(reports: Report[], key: SortKey, asc: boolean): Report[] {
  return [...reports].sort((a, b) => {
    let cmp = 0
    if (key === 'created_at') {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else if (key === 'severity') {
      cmp = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    } else if (key === 'status') {
      cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    } else if (key === 'verification_count') {
      cmp = (a.verification_count ?? 0) - (b.verification_count ?? 0)
    }
    return asc ? cmp : -cmp
  })
}

export default function MyReportsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')

  const fetchReports = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setReports((data as Report[]) ?? [])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      fetchReports()
    }
  }, [authLoading, user, router, fetchReports])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  // Filter + sort
  const displayed = sortReports(
    reports.filter(
      (r) =>
        (filterCategory === 'all' || r.category === filterCategory) &&
        (filterStatus === 'all' || r.status === filterStatus)
    ),
    sortKey,
    sortAsc
  )

  const SortBtn = ({ col, label }: { col: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(col)}
      style={{
        background: 'none',
        border: 'none',
        color: sortKey === col ? 'var(--color-orange)' : 'var(--color-paper-dim)',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '0.6875rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      <ArrowUpDown size={10} />
      {sortKey === col && <span style={{ fontSize: '0.5rem' }}>{sortAsc ? '↑' : '↓'}</span>}
    </button>
  )

  if (authLoading || (!user && loading)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavBar />
        <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </main>
      </div>
    )
  }

  if (!user) return null // Will redirect

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar />

      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
          {/* Header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div
              style={{
                display: 'inline-flex',
                gap: '0.5rem',
                background: 'var(--color-orange)',
                padding: '0.2rem 0.75rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.625rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-paper)',
                marginBottom: '0.75rem',
              }}
            >
              DASHBOARD — MY REPORTS
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                My Reports
              </h1>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--color-paper-dark)',
                }}
              >
                {displayed.length} / {reports.length} records
              </span>
            </div>
          </div>

          {/* Filters */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              padding: '0.75rem 1rem',
              background: 'var(--color-asphalt-light)',
              border: '1px solid var(--color-asphalt-mid)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="field-label" style={{ marginBottom: 0 }}>Category</span>
              <select
                className="field-input"
                style={{ width: 'auto', padding: '0.375rem 0.625rem', fontSize: '0.8125rem' }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as Category | 'all')}
                id="filter-category"
              >
                <option value="all">All</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="field-label" style={{ marginBottom: 0 }}>Status</span>
              <select
                className="field-input"
                style={{ width: 'auto', padding: '0.375rem 0.625rem', fontSize: '0.8125rem' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
                id="filter-status"
              >
                <option value="all">All</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Column headers */}
          {!loading && displayed.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr 1fr',
                gap: '0.75rem',
                padding: '0.5rem 1rem',
                borderBottom: '1px solid var(--color-asphalt-mid)',
                marginBottom: '0.5rem',
                alignItems: 'center',
              }}
            >
              <span className="field-label" style={{ marginBottom: 0 }}>Photo</span>
              <SortBtn col="created_at" label="Date & Details" />
              <span className="field-label" style={{ marginBottom: 0 }}>Category</span>
              <SortBtn col="severity" label="Severity" />
              <SortBtn col="status" label="Status" />
              <SortBtn col="verification_count" label="Confirmed" />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="empty-state">
              <span className="spinner" style={{ width: 28, height: 28 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-paper-dark)' }}>
                Loading your reports…
              </span>
            </div>
          )}

          {/* Empty state */}
          {!loading && displayed.length === 0 && (
            <div className="empty-state">
              <span className="empty-state-icon">📋</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', letterSpacing: '0.06em' }}>
                {reports.length > 0 ? 'No Reports Found' : "You haven't reported any issues yet"}
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                {reports.length > 0
                  ? 'Try adjusting your filters.'
                  : 'Submit a report to see it tracked here.'}
              </p>
              {reports.length === 0 && (
                <Link href="/report" className="btn-primary" style={{ textDecoration: 'none' }}>
                  Report an Issue
                </Link>
              )}
            </div>
          )}

          {/* Table rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {displayed.map((report) => (
              <div
                key={report.id}
                className={`report-tag sev-${report.severity}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr 1fr',
                  gap: '0.75rem',
                  alignItems: 'center',
                  clipPath: 'none',
                  borderRadius: 0,
                  cursor: 'pointer',
                }}
                onClick={() => router.push(`/?lat=${report.lat}&lng=${report.lng}&zoom=18`)}
              >
                {/* Photo thumbnail */}
                <div style={{ height: 48, width: 64, overflow: 'hidden', border: '1px solid var(--color-asphalt-mid)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={report.image_url} alt="Report" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* Date + description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6875rem',
                      color: 'var(--color-paper-dark)',
                    }}
                  >
                    {new Date(report.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.8125rem',
                      color: 'var(--color-paper)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={report.description}
                  >
                    {report.description}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.5625rem',
                      color: 'var(--color-paper-dark)',
                    }}
                  >
                    #{report.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                {/* Category */}
                <span className="category-tag" style={{ justifySelf: 'start' }}>
                  {CATEGORY_ICONS[report.category]} {CATEGORY_LABELS[report.category]}
                </span>

                {/* Severity */}
                <SeverityIndicator severity={report.severity} size="sm" />

                {/* Status */}
                <StatusBadge status={report.status} size="sm" />

                {/* Confirmations */}
                <span>
                  {(report.verification_count ?? 0) > 1 ? (
                    <span className="verify-count">
                      ×{report.verification_count}
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-paper-dark)' }}>
                      —
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
