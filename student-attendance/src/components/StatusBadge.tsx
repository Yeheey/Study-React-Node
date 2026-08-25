import { statusLabel } from '../constants/status'
import type { AttendanceStatus } from '../types'
import './StatusBadge.css'

interface StatusBadgeProps {
  status: AttendanceStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-${status}`}>{statusLabel[status]}</span>
}
