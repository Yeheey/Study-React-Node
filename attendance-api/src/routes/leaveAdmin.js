import { Router } from 'express'
import { listAllLeaveRequests, reviewLeaveRequest } from '../db/leave.js'
import { fail, ok } from '../utils/helpers.js'

const router = Router()

router.get('/', (req, res) => {
  const { keyword = '', status = '' } = req.query
  const list = listAllLeaveRequests({ keyword, status })
  return ok(res, { list, total: list.length })
})

router.patch('/:id', (req, res) => {
  const status = String(req.body?.status ?? '').trim()
  if (status !== 'approved' && status !== 'rejected') {
    return fail(res, '请选择通过或驳回')
  }

  const reviewRemark = String(req.body?.reviewRemark ?? '').trim()
  if (status === 'rejected' && !reviewRemark) {
    return fail(res, '驳回时请填写原因')
  }

  try {
    const record = reviewLeaveRequest(req.params.id, {
      status,
      reviewRemark,
      reviewedBy: req.user.username,
    })
    if (!record) return fail(res, '请假申请不存在', 404, 404)
    return ok(res, record, status === 'approved' ? '已通过' : '已驳回')
  } catch (err) {
    if (err.status) return fail(res, err.message, 1, err.status)
    throw err
  }
})

export default router
