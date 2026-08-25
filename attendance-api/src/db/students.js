import { getDb, isUniqueError } from './index.js'
import {
  createStudentLogin,
  deleteStudentLogin,
  findUserByUsername,
  isReservedUsername,
  syncStudentLogin,
} from './users.js'

function mapStudent(row) {
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    studentNo: row.student_no,
    className: row.class_name,
    grade: row.grade,
    phone: row.phone ?? '',
  }
}

export function listStudents({ keyword = '', grade = '' } = {}) {
  const q = String(keyword).trim().toLowerCase()
  const like = `%${q}%`
  const gradeFilter = String(grade).trim()

  const rows = getDb()
    .prepare(
      `SELECT id, name, student_no, class_name, grade, phone
       FROM students
       WHERE (@grade = '' OR grade = @grade)
         AND (
           @q = ''
           OR lower(name) LIKE @like
           OR lower(student_no) LIKE @like
           OR lower(class_name) LIKE @like
         )
       ORDER BY student_no ASC`,
    )
    .all({ grade: gradeFilter, q, like })

  return rows.map(mapStudent)
}

export function getStudentById(id) {
  if (!id) return null

  const row = getDb()
    .prepare(
      `SELECT id, name, student_no, class_name, grade, phone
       FROM students
       WHERE id = ?`,
    )
    .get(id)

  return mapStudent(row)
}

export function listGrades() {
  return getDb()
    .prepare(`SELECT DISTINCT grade FROM students WHERE grade != '' ORDER BY grade ASC`)
    .all()
    .map((row) => row.grade)
}

export function listClasses() {
  return getDb()
    .prepare(
      `SELECT DISTINCT class_name FROM students WHERE class_name != '' ORDER BY class_name ASC`,
    )
    .all()
    .map((row) => row.class_name)
}

function toAccountError(err) {
  const message = String(err?.message ?? '')
  if (message.includes('users.username')) {
    const error = new Error('该学号已被用作登录名')
    error.status = 400
    return error
  }
  if (isUniqueError(err)) {
    const error = new Error('学号已存在')
    error.status = 400
    return error
  }
  return err
}

function assertStudentNoAvailable(studentNo, { ignoreUsername = '' } = {}) {
  if (isReservedUsername(studentNo)) {
    const error = new Error('该学号不可用作登录名')
    error.status = 400
    throw error
  }

  if (ignoreUsername && studentNo === ignoreUsername) return

  const existing = findUserByUsername(studentNo)
  if (!existing) return

  const error = new Error('该学号已被用作登录名')
  error.status = 400
  throw error
}

export function createStudent({ name, studentNo, className, grade, phone = '' }) {
  assertStudentNoAvailable(studentNo)

  const db = getDb()
  const id = crypto.randomUUID()
  const insert = db.transaction(() => {
    db.prepare(
      `INSERT INTO students (id, name, student_no, class_name, grade, phone)
       VALUES (@id, @name, @studentNo, @className, @grade, @phone)`,
    ).run({
      id,
      name,
      studentNo,
      className,
      grade,
      phone,
    })
    createStudentLogin({ username: studentNo, displayName: name })
  })

  try {
    insert()
  } catch (err) {
    throw toAccountError(err)
  }

  return getStudentById(id)
}

export function updateStudent(id, patch) {
  const current = getStudentById(id)
  if (!current) return null

  const next = {
    name: patch.name ?? current.name,
    studentNo: patch.studentNo ?? current.studentNo,
    className: patch.className ?? current.className,
    grade: patch.grade ?? current.grade,
    phone: patch.phone ?? current.phone,
  }

  assertStudentNoAvailable(next.studentNo, { ignoreUsername: current.studentNo })

  const db = getDb()
  const update = db.transaction(() => {
    db.prepare(
      `UPDATE students
       SET name = @name,
           student_no = @studentNo,
           class_name = @className,
           grade = @grade,
           phone = @phone
       WHERE id = @id`,
    ).run({ id, ...next })
    syncStudentLogin({
      oldUsername: current.studentNo,
      username: next.studentNo,
      displayName: next.name,
    })
  })

  try {
    update()
  } catch (err) {
    throw toAccountError(err)
  }

  return getStudentById(id)
}

export function deleteStudent(id) {
  const current = getStudentById(id)
  if (!current) return null

  const db = getDb()
  const remove = db.transaction(() => {
    db.prepare('DELETE FROM students WHERE id = ?').run(id)
    deleteStudentLogin(current.studentNo)
  })
  remove()
  return current
}
