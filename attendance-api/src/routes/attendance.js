import { Router } from 'express'
import multer from 'multer'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { attendanceRecords, students, TODAY } from '../data/store.js'
import {
  parseImportWorkbook,
  validateImportRow,
} from '../utils/importAttendance.js'
import {
  VALID_STATUS,
  fail,
  filterAttendance,
  findDuplicateRecord,
  getDashboardStats,
  getTodayRecords,
  isValidDate,
  isValidTime,
  ok,
} from '../utils/helpers.js'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
})

function normalizeTime(value) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null

  const time = String(value).trim().slice(0, 5)
  if (!isValidTime(time)) return '__invalid__'
  return time
}

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

router.post(
  '/attendance/records/import',
  requireAuth,
  requireAdmin,
  upload.single('file'),
  (req, res) => {
    if (!req.file) {
      return fail(res, '请上传表格文件')
    }

    const parsed = parseImportWorkbook(req.file.buffer, req.file.originalname)
    if (parsed.error) {
      return fail(res, parsed.error)
    }

    const failed = []
    let created = 0
    let updated = 0

    for (const { excelRow, item } of parsed.rows) {
      const validated = validateImportRow(item)
      if (validated.error) {
        failed.push({ row: excelRow, message: validated.error })
        continue
      }

      const record = validated.record
      if (findDuplicateRecord(record.studentId, record.date, record.id)) {
        failed.push({
          row: excelRow,
          id: record.id,
          message: '该学生当天已有其他考勤记录',
        })
        continue
      }

      const index = attendanceRecords.findIndex((row) => row.id === record.id)
      if (index >= 0) {
        attendanceRecords[index] = record
        updated += 1
        continue
      }

      attendanceRecords.unshift(record)
      created += 1
    }

    return ok(res, { created, updated, failed }, '导入完成')
  },
)

router.post('/attendance/records', requireAuth, requireAdmin, (req, res) => {
  const { studentId, date, status, checkInTime, remark } = req.body ?? {}

  if (!studentId) return fail(res, '请选择学生')
  if (!isValidDate(date)) return fail(res, '请选择有效日期')
  if (!VALID_STATUS.has(status)) return fail(res, '无效的考勤状态')

  const student = students.find((item) => item.id === studentId)
  if (!student) return fail(res, '学生不存在', 404, 404)

  if (findDuplicateRecord(studentId, date)) {
    return fail(res, '该学生当天已有考勤记录')
  }

  const time = normalizeTime(checkInTime)
  if (time === '__invalid__') return fail(res, '打卡时间格式应为 HH:mm')

  const record = {
    id: `r-${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    studentNo: student.studentNo,
    className: student.className,
    date,
    checkInTime: time ?? null,
    status,
    remark: remark ? String(remark).trim() : undefined,
  }

  attendanceRecords.unshift(record)
  return ok(res, record, '新增成功')
})

router.patch('/attendance/:id', requireAuth, requireAdmin, (req, res) => {
  const record = attendanceRecords.find((item) => item.id === req.params.id)
  if (!record) return fail(res, '考勤记录不存在', 404, 404)

  const { status, checkInTime, remark, date } = req.body ?? {}

  if (date !== undefined) {
    if (!isValidDate(date)) return fail(res, '请选择有效日期')
    if (findDuplicateRecord(record.studentId, date, record.id)) {
      return fail(res, '该学生当天已有考勤记录')
    }
    record.date = date
  }

  if (status !== undefined) {
    if (!VALID_STATUS.has(status)) return fail(res, '无效的考勤状态')
    record.status = status
  }

  if (checkInTime !== undefined) {
    const time = normalizeTime(checkInTime)
    if (time === '__invalid__') return fail(res, '打卡时间格式应为 HH:mm')
    record.checkInTime = time
  }

  if (remark !== undefined) {
    const text = String(remark).trim()
    if (text) {
      record.remark = text
    } else {
      delete record.remark
    }
  }

  return ok(res, record, '更新成功')
})

router.delete('/attendance/:id', requireAuth, requireAdmin, (req, res) => {
  const index = attendanceRecords.findIndex((item) => item.id === req.params.id)
  if (index < 0) return fail(res, '考勤记录不存在', 404, 404)

  const [removed] = attendanceRecords.splice(index, 1)
  return ok(res, removed, '删除成功')
})

router.post('/attendance/check-in', (req, res) => {
  const { studentId, checkInTime, status = 'present', remark } = req.body ?? {}

  if (!studentId) return fail(res, '缺少 studentId')

  const student = students.find((item) => item.id === studentId)
  if (!student) return fail(res, '学生不存在', 404, 404)

  if (!VALID_STATUS.has(status)) return fail(res, '无效的考勤状态')

  let record = attendanceRecords.find(
    (item) => item.studentId === studentId && item.date === TODAY,
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
    return ok(res, record, '打卡成功')
  }

  record.checkInTime = checkInTime ?? record.checkInTime
  record.status = status
  if (remark !== undefined) record.remark = remark
  return ok(res, record, '打卡成功')
})

export default router
