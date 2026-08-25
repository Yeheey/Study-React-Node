export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave'

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

export interface DashboardStats {
  totalStudents: number
  presentToday: number
  lateToday: number
  absentToday: number
  leaveToday: number
  attendanceRate: number
}
