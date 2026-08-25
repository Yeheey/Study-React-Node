import type { AttendanceStatus } from '../types'

export const statusLabel: Record<AttendanceStatus, string> = {
  present: '已到',
  late: '迟到',
  absent: '缺勤',
  leave: '请假',
}

export const statusTagColor: Record<AttendanceStatus, string> = {
  present: 'success',
  late: 'warning',
  absent: 'error',
  leave: 'processing',
}

export const statusFilterOptions: Array<{ value: AttendanceStatus; label: string }> = [
  { value: 'present', label: '已到' },
  { value: 'late', label: '迟到' },
  { value: 'absent', label: '缺勤' },
  { value: 'leave', label: '请假' },
]
