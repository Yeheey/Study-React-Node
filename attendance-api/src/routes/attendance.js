import { Router } from 'express'
import multer from 'multer'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import {
  createRecord,
  deleteRecord,
  findDuplicateRecord,
  getDashboardStats,
  getRecordById,
  getToday,
  listAttendance,
  listDates,
  updateRecord,
  upsertRecord,
} from '../db/attendance.js'
import { getStudentById, listClasses, listGrades } from '../db/students.js'
import {
  parseImportWorkbook,
  validateImportRow,
} from '../utils/importAttendance.js'
import {
  VALID_STATUS,
  fail,
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

function handleDbError(res, err) {
  if (err.status) return fail(res, err.message, 1, err.status)
  throw err
}

router.get('/dashboard/stats', (_req, res) => {
  return ok(res, getDashboardStats())
})

router.get('/attendance/today', (req, res) => {
  const { keyword = '', className = '', status = '' } = req.query
  const today = getToday()
  const list = listAttendance({ keyword, className, status, date: today })
  return ok(res, { list, total: list.length, date: today })
})

router.get('/attendance/records', (req, res) => {
  const { keyword = '', className = '', status = '', date = '' } = req.query
  const list = listAttendance({ keyword, className, status, date })
  return ok(res, { list, total: list.length })
})

router.get('/meta/options', (_req, res) => {
  return ok(res, {
    classes: listClasses(),
    grades: listGrades(),
    dates: listDates(),
    today: getToday(),
  })
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

    const parsed = parseImportWorkbook(req.file.buffer, req.file.originalname, req.file.mimetype)
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

      try {
        const result = upsertRecord(record)
        if (result.created) {
          created += 1
          continue
        }
        updated += 1
      } catch (err) {
        failed.push({
          row: excelRow,
          id: record.id,
          message: err.message || '导入失败',
        })
      }
    }

    return ok(res, { created, updated, failed }, '导入完成')
  },
)

router.post('/attendance/records', requireAuth, requireAdmin, (req, res) => {
  const { studentId, date, status, checkInTime, remark } = req.body ?? {}

  if (!studentId) return fail(res, '请选择学生')
  if (!isValidDate(date)) return fail(res, '请选择有效日期')
  if (!VALID_STATUS.has(status)) return fail(res, '无效的考勤状态')

  const student = getStudentById(studentId)
  if (!student) return fail(res, '学生不存在', 404, 404)

  if (findDuplicateRecord(studentId, date)) {
    return fail(res, '该学生当天已有考勤记录')
  }

  const time = normalizeTime(checkInTime)
  if (time === '__invalid__') return fail(res, '打卡时间格式应为 HH:mm')

  try {
    const record = createRecord({
      studentId: student.id,
      date,
      checkInTime: time ?? null,
      status,
      remark,
    })
    return ok(res, record, '新增成功')
  } catch (err) {
    return handleDbError(res, err)
  }
})

router.patch('/attendance/:id', requireAuth, requireAdmin, (req, res) => {
  const current = getRecordById(req.params.id)
  if (!current) return fail(res, '考勤记录不存在', 404, 404)

  const { status, checkInTime, remark, date } = req.body ?? {}
  const patch = {}

  if (date !== undefined) {
    if (!isValidDate(date)) return fail(res, '请选择有效日期')
    if (findDuplicateRecord(current.studentId, date, current.id)) {
      return fail(res, '该学生当天已有考勤记录')
    }
    patch.date = date
  }

  if (status !== undefined) {
    if (!VALID_STATUS.has(status)) return fail(res, '无效的考勤状态')
    patch.status = status
  }

  if (checkInTime !== undefined) {
    const time = normalizeTime(checkInTime)
    if (time === '__invalid__') return fail(res, '打卡时间格式应为 HH:mm')
    patch.checkInTime = time
  }

  if (remark !== undefined) {
    patch.remark = remark
  }

  try {
    const record = updateRecord(current.id, patch)
    return ok(res, record, '更新成功')
  } catch (err) {
    return handleDbError(res, err)
  }
})

router.delete('/attendance/:id', requireAuth, requireAdmin, (req, res) => {
  const removed = deleteRecord(req.params.id)
  if (!removed) return fail(res, '考勤记录不存在', 404, 404)
  return ok(res, removed, '删除成功')
})

router.post('/attendance/check-in', (req, res) => {
  const { studentId, checkInTime, status = 'present', remark } = req.body ?? {}

  if (!studentId) return fail(res, '缺少 studentId')

  const student = getStudentById(studentId)
  if (!student) return fail(res, '学生不存在', 404, 404)

  if (!VALID_STATUS.has(status)) return fail(res, '无效的考勤状态')

  const today = getToday()
  const existing = findDuplicateRecord(studentId, today)
  const time = normalizeTime(checkInTime)
  if (time === '__invalid__') return fail(res, '打卡时间格式应为 HH:mm')

  try {
    if (!existing) {
      const record = createRecord({
        studentId: student.id,
        date: today,
        checkInTime: time ?? null,
        status,
        remark,
      })
      return ok(res, record, '打卡成功')
    }

    const record = updateRecord(existing.id, {
      checkInTime: time === undefined ? existing.checkInTime : time,
      status,
      remark,
    })
    return ok(res, record, '打卡成功')
  } catch (err) {
    return handleDbError(res, err)
  }
})

export default router
