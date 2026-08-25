import { Router } from 'express'
import {
  createStudent,
  deleteStudent,
  getStudentById,
  listStudents,
  updateStudent,
} from '../db/students.js'
import { fail, ok } from '../utils/helpers.js'

const router = Router()

function normalizeStudentInput(body = {}) {
  return {
    name: String(body.name ?? '').trim(),
    studentNo: String(body.studentNo ?? '').trim(),
    className: String(body.className ?? '').trim(),
    grade: String(body.grade ?? '').trim(),
    phone: String(body.phone ?? '').trim(),
  }
}

function validateStudentInput(input, { partial = false } = {}) {
  const required = ['name', 'studentNo', 'className', 'grade']

  for (const field of required) {
    if (partial && input[field] === undefined) continue
    if (partial && !(field in input)) continue
    if (!String(input[field] ?? '').trim()) {
      return '请填写姓名、学号、班级和年级'
    }
  }

  return ''
}

router.get('/', (req, res) => {
  const { keyword = '', grade = '' } = req.query
  const list = listStudents({ keyword, grade })
  return ok(res, { list, total: list.length })
})

router.get('/:id', (req, res) => {
  const student = getStudentById(req.params.id)
  if (!student) return fail(res, '学生不存在', 404, 404)
  return ok(res, student)
})

router.post('/', (req, res) => {
  const input = normalizeStudentInput(req.body)
  const message = validateStudentInput(input)
  if (message) return fail(res, message)

  try {
    const student = createStudent(input)
    return ok(res, student, '新增成功')
  } catch (err) {
    if (err.status) return fail(res, err.message, 1, err.status)
    throw err
  }
})

router.patch('/:id', (req, res) => {
  const body = req.body ?? {}
  const patch = {}

  if (body.name !== undefined) patch.name = String(body.name).trim()
  if (body.studentNo !== undefined) patch.studentNo = String(body.studentNo).trim()
  if (body.className !== undefined) patch.className = String(body.className).trim()
  if (body.grade !== undefined) patch.grade = String(body.grade).trim()
  if (body.phone !== undefined) patch.phone = String(body.phone).trim()

  const message = validateStudentInput(patch, { partial: true })
  if (message) return fail(res, message)

  try {
    const student = updateStudent(req.params.id, patch)
    if (!student) return fail(res, '学生不存在', 404, 404)
    return ok(res, student, '更新成功')
  } catch (err) {
    if (err.status) return fail(res, err.message, 1, err.status)
    throw err
  }
})

router.delete('/:id', (req, res) => {
  const student = deleteStudent(req.params.id)
  if (!student) return fail(res, '学生不存在', 404, 404)
  return ok(res, student, '删除成功')
})

export default router
