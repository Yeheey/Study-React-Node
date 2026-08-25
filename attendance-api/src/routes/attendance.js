import { Router } from 'express'
import { attendanceRecords, students, TODAY } from '../data/store.js'
import {
  fail,
  filterAttendance,
  getDashboardStats,
  getTodayRecords,
  ok,
} from '../utils/helpers.js'

const router = Router()
const VALID_STATUS = new Set(['present', 'late', 'absent', 'leave'])

router.get('/dashboard/stats', (_req, res) => {
  return ok(res, getDashboardStats())
})

router.get('/attendance/today', (req, res) => {
  const { keyword = '', className = '', status = '' } = req.query
  const list = filterAttendance(getTodayRecords(), { keyword, className, status })
  return ok(res, { list, total: list.length, date: TODAY })
})

router.get('/attendance/records', (req, res) => {
  const { keyword = '', className = '', status = '', date = '' } = req.query
  const list = filterAttendance(attendanceRecords, { keyword, className, status, date })
  return ok(res, { list, total: list.length })
})

router.get('/meta/options', (_req, res) => {
  const classes = [...new Set(students.map((s) => s.className))]
  const grades = [...new Set(students.map((s) => s.grade))]
  const dates = [...new Set(attendanceRecords.map((r) => r.date))].sort().reverse()

  return ok(res, { classes, grades, dates, today: TODAY })
})

router.patch('/attendance/:id', (req, res) => {
  const record = attendanceRecords.find((r) => r.id === req.params.id)
  if (!record) return fail(res, '考勤记录不存在', 404, 404)

  const { status, checkInTime, remark } = req.body ?? {}

  if (status !== undefined) {
    if (!VALID_STATUS.has(status)) {
      return fail(res, '无效的考勤状态')
    }
    record.status = status
  }

  if (checkInTime !== undefined) {
    record.checkInTime = checkInTime
  }

  if (remark !== undefined) {
    record.remark = remark
  }

  return ok(res, record, '更新成功')
})

router.post('/attendance/check-in', (req, res) => {
  const { studentId, checkInTime, status = 'present', remark } = req.body ?? {}

  if (!studentId) return fail(res, '缺少 studentId')

  const student = students.find((s) => s.id === studentId)
  if (!student) return fail(res, '学生不存在', 404, 404)

  if (!VALID_STATUS.has(status)) return fail(res, '无效的考勤状态')

  let record = attendanceRecords.find(
    (r) => r.studentId === studentId && r.date === TODAY,
  )

  if (!record) {
    record = {
      id: `r-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      studentNo: student.studentNo,
      className: student.className,
      date: TODAY,
      checkInTime: checkInTime ?? null,
      status,
      remark,
    }
    attendanceRecords.unshift(record)
  } else {
    record.checkInTime = checkInTime ?? record.checkInTime
    record.status = status
    if (remark !== undefined) record.remark = remark
  }

  return ok(res, record, '打卡成功')
})

export default router
