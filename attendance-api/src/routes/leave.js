import { Router } from 'express'
import { createLeaveRequest, listLeaveRequestsByUsername, VALID_LEAVE_TYPE } from '../db/leave.js'
import { fail, isValidDate, ok } from '../utils/helpers.js'

const router = Router()

router.get('/', (req, res) => {
  const list = listLeaveRequestsByUsername(req.user.username)
  return ok(res, { list, total: list.length })
})

router.post('/', (req, res) => {
  const leaveType = String(req.body?.leaveType ?? '').trim()
  const startDate = String(req.body?.startDate ?? '').trim()
  const endDate = String(req.body?.endDate ?? '').trim()
  const reason = String(req.body?.reason ?? '').trim()

  if (!VALID_LEAVE_TYPE.has(leaveType)) {
    return fail(res, '请假类型须为事假或病假')
  }
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return fail(res, '请选择有效的请假日期')
  }
  if (endDate < startDate) {
    return fail(res, '结束日期不能早于开始日期')
  }
  if (!reason) {
    return fail(res, '请填写请假原因')
  }
  if (reason.length > 200) {
    return fail(res, '请假原因不能超过 200 字')
  }

  const record = createLeaveRequest({
    username: req.user.username,
    leaveType,
    startDate,
    endDate,
    reason,
  })

  return ok(res, record, '提交成功')
})

export default router
