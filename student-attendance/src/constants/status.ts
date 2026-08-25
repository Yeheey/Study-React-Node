import type { AttendanceStatus } from '../types'

export const statusLabel: Record<AttendanceStatus, string> = {
  present: '已到',
  late: '迟到',
  absent: '缺勤',
  leave: '请假',
}
