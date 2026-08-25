import { attendanceRecords, students, TODAY } from '../data/store.js'

export function ok(res, data, message = 'success') {
  return res.json({ code: 0, message, data })
}

export function fail(res, message = 'error', code = 1, status = 400) {
  return res.status(status).json({ code, message, data: null })
}

export function getTodayRecords() {
  return attendanceRecords.filter((r) => r.date === TODAY)
}

export function getDashboardStats() {
  const today = getTodayRecords()
  const presentToday = today.filter((r) => r.status === 'present').length
  const lateToday = today.filter((r) => r.status === 'late').length
  const absentToday = today.filter((r) => r.status === 'absent').length
  const leaveToday = today.filter((r) => r.status === 'leave').length
  const totalStudents = students.length
  const attendanceRate =
    totalStudents === 0
      ? 0
      : Math.round(((presentToday + lateToday) / totalStudents) * 1000) / 10

  return {
    totalStudents,
    presentToday,
    lateToday,
    absentToday,
    leaveToday,
    attendanceRate,
    today: TODAY,
  }
}

export function filterStudents({ keyword = '', grade = '' } = {}) {
  const q = String(keyword).trim().toLowerCase()

  return students.filter((s) => {
    if (grade && s.grade !== grade) return false
    if (!q) return true

    return (
      s.name.toLowerCase().includes(q) ||
      s.studentNo.toLowerCase().includes(q) ||
      s.className.toLowerCase().includes(q)
    )
  })
}

export function filterAttendance(list, { keyword = '', className = '', status = '', date = '' } = {}) {
  const q = String(keyword).trim().toLowerCase()

  return list.filter((row) => {
    if (date && row.date !== date) return false
    if (className && row.className !== className) return false
    if (status && row.status !== status) return false
    if (!q) return true

    return (
      row.studentName.toLowerCase().includes(q) ||
      row.studentNo.toLowerCase().includes(q)
    )
  })
}
