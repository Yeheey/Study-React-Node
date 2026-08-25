import { getDb, isUniqueError } from './index.js'
import { getStudentById } from './students.js'

const RECORD_SELECT = `
  SELECT
    r.id,
    r.student_id,
    s.name AS student_name,
    s.student_no,
    s.class_name,
    r.date,
    r.check_in_time,
    r.status,
    r.remark
  FROM attendance_records r
  JOIN students s ON s.id = r.student_id
`

function mapRecord(row) {
  if (!row) return null

  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    studentNo: row.student_no,
    className: row.class_name,
    date: row.date,
    checkInTime: row.check_in_time,
    status: row.status,
    remark: row.remark || undefined,
  }
}

export function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getRecordById(id) {
  if (!id) return null

  const row = getDb().prepare(`${RECORD_SELECT} WHERE r.id = ?`).get(id)
  return mapRecord(row)
}

export function findDuplicateRecord(studentId, date, excludeId = '') {
  const row = getDb()
    .prepare(
      `${RECORD_SELECT}
       WHERE r.student_id = ?
         AND r.date = ?
         AND r.id != ?`,
    )
    .get(studentId, date, excludeId)

  return mapRecord(row)
}

export function listAttendance({
  keyword = '',
  className = '',
  status = '',
  date = '',
} = {}) {
  const q = String(keyword).trim().toLowerCase()
  const like = `%${q}%`

  const rows = getDb()
    .prepare(
      `${RECORD_SELECT}
       WHERE (@date = '' OR r.date = @date)
         AND (@className = '' OR s.class_name = @className)
         AND (@status = '' OR r.status = @status)
         AND (
           @q = ''
           OR lower(s.name) LIKE @like
           OR lower(s.student_no) LIKE @like
         )
       ORDER BY r.date DESC, r.check_in_time IS NULL, r.check_in_time DESC, s.student_no ASC`,
    )
    .all({
      date: String(date).trim(),
      className: String(className).trim(),
      status: String(status).trim(),
      q,
      like,
    })

  return rows.map(mapRecord)
}

export function listDates() {
  return getDb()
    .prepare(`SELECT DISTINCT date FROM attendance_records ORDER BY date DESC`)
    .all()
    .map((row) => row.date)
}

export function getDashboardStats() {
  const today = getToday()
  const totalStudents = getDb().prepare('SELECT COUNT(*) AS total FROM students').get().total
  const counts = getDb()
    .prepare(
      `SELECT status, COUNT(*) AS total
       FROM attendance_records
       WHERE date = ?
       GROUP BY status`,
    )
    .all(today)

  const byStatus = Object.fromEntries(counts.map((row) => [row.status, row.total]))
  const presentToday = byStatus.present ?? 0
  const lateToday = byStatus.late ?? 0
  const absentToday = byStatus.absent ?? 0
  const leaveToday = byStatus.leave ?? 0
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
    today,
  }
}

function toRemark(value) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

export function createRecord({ studentId, date, status, checkInTime = null, remark, id }) {
  const student = getStudentById(studentId)
  if (!student) {
    const error = new Error('学生不存在')
    error.status = 404
    throw error
  }

  const recordId = id || crypto.randomUUID()

  try {
    getDb()
      .prepare(
        `INSERT INTO attendance_records (id, student_id, date, check_in_time, status, remark)
         VALUES (@id, @studentId, @date, @checkInTime, @status, @remark)`,
      )
      .run({
        id: recordId,
        studentId: student.id,
        date,
        checkInTime,
        status,
        remark: toRemark(remark),
      })
  } catch (err) {
    if (isUniqueError(err)) {
      const error = new Error('该学生当天已有考勤记录')
      error.status = 400
      throw error
    }
    throw err
  }

  return getRecordById(recordId)
}

export function updateRecord(id, patch) {
  const current = getDb()
    .prepare(
      `SELECT id, student_id, date, check_in_time, status, remark
       FROM attendance_records
       WHERE id = ?`,
    )
    .get(id)

  if (!current) return null

  const next = {
    studentId: patch.studentId ?? current.student_id,
    date: patch.date ?? current.date,
    status: patch.status ?? current.status,
    checkInTime: patch.checkInTime === undefined ? current.check_in_time : patch.checkInTime,
    remark: patch.remark === undefined ? current.remark : toRemark(patch.remark),
  }

  if (patch.studentId && !getStudentById(next.studentId)) {
    const error = new Error('学生不存在')
    error.status = 404
    throw error
  }

  try {
    getDb()
      .prepare(
        `UPDATE attendance_records
         SET student_id = @studentId,
             date = @date,
             check_in_time = @checkInTime,
             status = @status,
             remark = @remark
         WHERE id = @id`,
      )
      .run({ id, ...next })
  } catch (err) {
    if (isUniqueError(err)) {
      const error = new Error('该学生当天已有考勤记录')
      error.status = 400
      throw error
    }
    throw err
  }

  return getRecordById(id)
}

export function deleteRecord(id) {
  const current = getRecordById(id)
  if (!current) return null

  getDb().prepare('DELETE FROM attendance_records WHERE id = ?').run(id)
  return current
}

export function upsertRecord(record) {
  const existing = getRecordById(record.id)
  if (!existing) {
    return { record: createRecord(record), created: true }
  }

  const updated = updateRecord(record.id, {
    studentId: record.studentId,
    date: record.date,
    status: record.status,
    checkInTime: record.checkInTime,
    remark: record.remark,
  })

  return { record: updated, created: false }
}
