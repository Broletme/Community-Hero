import type { Severity } from '@/lib/types'
import { SEVERITY_COLORS } from '@/lib/types'

interface SeverityIndicatorProps {
  severity: Severity
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export default function SeverityIndicator({
  severity,
  showLabel = true,
  size = 'md',
}: SeverityIndicatorProps) {
  const label = severity.toUpperCase()
  const color = SEVERITY_COLORS[severity]

  return (
    <span
      className={`severity-badge sev-${severity}`}
      style={{ fontSize: size === 'sm' ? '0.625rem' : undefined }}
      title={`Severity: ${label}`}
      aria-label={`Severity: ${label}`}
    >
      {showLabel ? label : null}
    </span>
  )
}

/** Just the colored dot, no text */
export function SeverityDot({ severity }: { severity: Severity }) {
  const color = SEVERITY_COLORS[severity]
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
      title={`Severity: ${severity}`}
    />
  )
}
