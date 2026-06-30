import type { SubmitReportResult } from '@/lib/types'
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/types'
import SeverityIndicator from './SeverityIndicator'

interface SubmitResultProps {
  result: SubmitReportResult & { fallback?: boolean }
  onDone: () => void
  onReportAnother: () => void
}

export default function SubmitResult({ result, onDone, onReportAnother }: SubmitResultProps) {
  const { report, merged, clusterCount, fallback } = result

  return (
    <div
      className={`result-banner ${merged ? 'merged' : 'new-issue'}`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Header stamp */}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '1.5rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: merged ? 'var(--color-sev-medium)' : 'var(--color-orange)',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
        }}
      >
        <span style={{ fontSize: '1.75rem' }}>{merged ? '🔗' : '📋'}</span>
        {merged ? 'Duplicate Detected' : 'New Issue Logged'}
      </div>

      {/* Message */}
      <p
        style={{
          fontSize: '0.9375rem',
          color: 'var(--color-paper)',
          marginBottom: '1rem',
          lineHeight: 1.6,
        }}
      >
        {merged ? (
          <>
            This issue already exists in our database.{' '}
            <strong style={{ color: 'var(--color-sev-medium)', fontFamily: 'var(--font-mono)' }}>
              {clusterCount} {clusterCount === 1 ? 'person has' : 'people have'}
            </strong>{' '}
            now reported this exact problem — your confirmation raises its priority.
          </>
        ) : (
          <>
            Your report has been submitted and is now visible on the live map. Community members
            nearby will be able to confirm this issue.
          </>
        )}
      </p>

      {/* Report summary */}
      <div
        style={{
          background: 'var(--color-asphalt)',
          border: '1px solid var(--color-asphalt-mid)',
          padding: '0.875rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="category-tag">
            {CATEGORY_ICONS[report.category]} {CATEGORY_LABELS[report.category]}
          </span>
          <SeverityIndicator severity={report.severity} size="sm" />
        </div>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--color-paper-dim)',
            margin: 0,
          }}
        >
          {report.description}
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              color: 'var(--color-paper-dark)',
            }}
          >
            ID: #{report.id.slice(0, 8).toUpperCase()}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              color: 'var(--color-paper-dark)',
            }}
          >
            {report.lat.toFixed(5)}, {report.lng.toFixed(5)}
          </span>
        </div>
      </div>

      {/* AI fallback notice */}
      {fallback && (
        <div
          style={{
            border: '1px dashed var(--color-sev-medium)',
            padding: '0.625rem 0.875rem',
            marginBottom: '1rem',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: 'var(--color-sev-medium)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            AI categorization was unavailable — issue filed as &quot;Other / Medium&quot;. A
            community member or admin can update the category.
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={onReportAnother} id="report-another-btn">
          + Report Another
        </button>
        <button className="btn-secondary" onClick={onDone} id="view-map-btn">
          View on Map
        </button>
      </div>
    </div>
  )
}
