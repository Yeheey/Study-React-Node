export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave'

export type UserRole = 'admin' | 'user' | 'student'

export type LeaveType = 'personal' | 'sick'

export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface AuthUser {
  username: string
  role: UserRole
  displayName: string
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export interface Student {
  id: string
  name: string
  studentNo: string
  className: string
  grade: string
  phone: string
}

export interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  studentNo: string
  className: string
  date: string
  checkInTime: string | null
  status: AttendanceStatus
  remark?: string
}

export interface ImportAttendanceResult {
  created: number
  updated: number
  failed: Array<{ row: number; id?: string; message: string }>
}

export interface LeaveRequest {
  id: string
  username: string
  studentName?: string
  studentNo?: string
  className?: string
  grade?: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  reason: string
  status: LeaveStatus
  createdAt: string
  reviewRemark?: string
  reviewedAt?: string
  reviewedBy?: string
}

export interface DashboardStats {
  totalStudents: number
  presentToday: number
  lateToday: number
  absentToday: number
  leaveToday: number
  attendanceRate: number
}
