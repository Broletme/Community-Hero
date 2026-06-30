import type { Report } from '@/lib/types'
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/types'
import SeverityIndicator from './SeverityIndicator'
import StatusBadge from './StatusBadge'

interface ReportCardProps {
  report: Report
  confirmations?: number
  onClick?: () => void
  compact?: boolean
}

export default function ReportCard({
  report,
  confirmations,
  onClick,
  compact = false,
}: ReportCardProps) {
  const totalConfirmations = confirmations ?? report.verification_count

  return (
    <div
      className={`report-tag sev-${report.severity}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      style={{
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Top row: category + severity + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <span className="category-tag">
          {CATEGORY_ICONS[report.category]} {CATEGORY_LABELS[report.category]}
        </span>
        <SeverityIndicator severity={report.severity} size="sm" />
        <StatusBadge status={report.status} size="sm" />
        {totalConfirmations > 1 && (
          <span className="verify-count">
            ×{totalConfirmations} confirmed
          </span>
        )}
      </div>

      {/* Description */}
      {!compact && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--color-paper-dim)',
            margin: '0 0 0.75rem',
            lineHeight: 1.5,
          }}
        >
          {report.description}
        </p>
      )}

      {/* Footer: ID + coords + timestamp */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.625rem',
            color: 'var(--color-paper-dark)',
            letterSpacing: '0.04em',
          }}
        >
          #{report.id.slice(0, 8).toUpperCase()}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.625rem',
            color: 'var(--color-paper-dark)',
          }}
        >
          {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.625rem',
            color: 'var(--color-paper-dark)',
          }}
        >
          {new Date(report.created_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
          })}
        </span>
      </div>

      {/* Photo thumbnail (not compact) */}
      {!compact && report.image_url && (
        <div style={{ marginTop: '0.75rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={report.image_url}
            alt={`Photo of ${CATEGORY_LABELS[report.category]}`}
            style={{
              width: '100%',
              height: 120,
              objectFit: 'cover',
              display: 'block',
              borderTop: '1px solid var(--color-asphalt-mid)',
              marginTop: '0.5rem',
              paddingTop: '0.5rem',
            }}
          />
        </div>
      )}
    </div>
  )
}
