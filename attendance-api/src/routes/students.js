import { Router } from 'express'
import { students } from '../data/store.js'
import { fail, filterStudents, ok } from '../utils/helpers.js'

const router = Router()

router.get('/', (req, res) => {
  const { keyword = '', grade = '' } = req.query
  const list = filterStudents({ keyword, grade })
  return ok(res, { list, total: list.length })
})

router.get('/:id', (req, res) => {
  const student = students.find((s) => s.id === req.params.id)
  if (!student) return fail(res, '学生不存在', 404, 404)
  return ok(res, student)
})

export default router
