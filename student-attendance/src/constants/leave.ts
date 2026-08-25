import type { LeaveStatus, LeaveType } from '../types'

export const leaveTypeLabel: Record<LeaveType, string> = {
  personal: '事假',
  sick: '病假',
}

export const leaveTypeOptions: Array<{ value: LeaveType; label: string }> = [
  { value: 'personal', label: '事假' },
  { value: 'sick', label: '病假' },
]

export const leaveStatusLabel: Record<LeaveStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
}

export const leaveStatusColor: Record<LeaveStatus, string> = {
  pending: 'processing',
  approved: 'success',
  rejected: 'error',
}

export const leaveStatusFilterOptions: Array<{ value: LeaveStatus; label: string }> = [
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
]
