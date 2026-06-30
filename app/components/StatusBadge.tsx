import type { Status } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/types'

interface StatusBadgeProps {
  status: Status
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span
      className={`status-chip status-${status}`}
      style={{ fontSize: size === 'sm' ? '0.6rem' : undefined }}
      aria-label={`Status: ${STATUS_LABELS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
