import type {
  AttendanceRecord,
  AuthSession,
  DashboardStats,
  ImportAttendanceResult,
  Student,
} from '../types'
import { getStoredAuth } from '../auth/session'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredAuth()?.token
  const headers = new Headers(init?.headers)
  if (!(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(path, { ...init, headers })

  let body: ApiResponse<T> | null = null
  try {
    body = (await res.json()) as ApiResponse<T>
  } catch {
    body = null
  }

  if (!res.ok || !body || body.code !== 0) {
    throw new Error(body?.message || `请求失败: ${res.status}`)
  }

  return body.data
}

export function login(payload: { username: string; password: string }) {
  return request<AuthSession>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
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

export function createAttendanceRecord(payload: {
  studentId: string
  date: string
  status: string
  checkInTime?: string | null
  remark?: string
}) {
  return request<AttendanceRecord>('/api/attendance/records', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateAttendanceRecord(
  id: string,
  payload: {
    date?: string
    status?: string
    checkInTime?: string | null
    remark?: string
  },
) {
  return request<AttendanceRecord>(`/api/attendance/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteAttendanceRecord(id: string) {
  return request<AttendanceRecord>(`/api/attendance/${id}`, {
    method: 'DELETE',
  })
}

export function importAttendanceRecords(file: File) {
  const body = new FormData()
  body.append('file', file)
  return request<ImportAttendanceResult>('/api/attendance/records/import', {
    method: 'POST',
    body,
  })
}
