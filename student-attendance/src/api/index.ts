import type { AttendanceRecord, DashboardStats, Student } from '../types'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!res.ok) {
    throw new Error(`请求失败: ${res.status}`)
  }

  const body = (await res.json()) as ApiResponse<T>
  if (body.code !== 0) {
    throw new Error(body.message || '接口返回异常')
  }

  return body.data
}

export function fetchDashboardStats() {
  return request<DashboardStats & { today?: string }>('/api/dashboard/stats')
}

export function fetchStudents(params: { keyword?: string; grade?: string } = {}) {
  const q = new URLSearchParams()
  if (params.keyword) q.set('keyword', params.keyword)
  if (params.grade) q.set('grade', params.grade)
  const qs = q.toString()
  return request<{ list: Student[]; total: number }>(`/api/students${qs ? `?${qs}` : ''}`)
}

export function fetchTodayAttendance(params: {
  keyword?: string
  className?: string
  status?: string
} = {}) {
  const q = new URLSearchParams()
  if (params.keyword) q.set('keyword', params.keyword)
  if (params.className) q.set('className', params.className)
  if (params.status) q.set('status', params.status)
  const qs = q.toString()
  return request<{ list: AttendanceRecord[]; total: number; date: string }>(
    `/api/attendance/today${qs ? `?${qs}` : ''}`,
  )
}

export function fetchAttendanceRecords(params: {
  keyword?: string
  className?: string
  status?: string
  date?: string
} = {}) {
  const q = new URLSearchParams()
  if (params.keyword) q.set('keyword', params.keyword)
  if (params.className) q.set('className', params.className)
  if (params.status) q.set('status', params.status)
  if (params.date) q.set('date', params.date)
  const qs = q.toString()
  return request<{ list: AttendanceRecord[]; total: number }>(
    `/api/attendance/records${qs ? `?${qs}` : ''}`,
  )
}

export function fetchMetaOptions() {
  return request<{
    classes: string[]
    grades: string[]
    dates: string[]
    today: string
  }>('/api/meta/options')
}
