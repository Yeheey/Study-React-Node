import { getDb } from './index.js'

export const VALID_LEAVE_TYPE = new Set(['personal', 'sick'])
export const VALID_LEAVE_STATUS = new Set(['pending', 'approved', 'rejected'])

const LEAVE_SELECT = `
  SELECT
    r.id,
    r.username,
    r.leave_type,
    r.start_date,
    r.end_date,
    r.reason,
    r.status,
    r.created_at,
    r.review_remark,
    r.reviewed_at,
    r.reviewed_by,
    COALESCE(s.name, u.display_name, r.username) AS student_name,
    COALESCE(s.student_no, r.username) AS student_no,
    s.class_name,
    s.grade
  FROM leave_requests r
  LEFT JOIN users u ON u.username = r.username
  LEFT JOIN students s ON s.student_no = r.username
`

function mapLeaveRequest(row) {
  if (!row) return null

  return {
    id: row.id,
    username: row.username,
    studentName: row.student_name,
    studentNo: row.student_no,
    className: row.class_name || undefined,
    grade: row.grade || undefined,
    leaveType: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
    reviewRemark: row.review_remark || undefined,
    reviewedAt: row.reviewed_at || undefined,
    reviewedBy: row.reviewed_by || undefined,
  }
}

export function getLeaveRequestById(id) {
  if (!id) return null
  const row = getDb().prepare(`${LEAVE_SELECT} WHERE r.id = ?`).get(id)
  return mapLeaveRequest(row)
}

export function listLeaveRequestsByUsername(username) {
  const name = String(username ?? '').trim()
  if (!name) return []

  const rows = getDb()
    .prepare(`${LEAVE_SELECT} WHERE r.username = ? ORDER BY r.created_at DESC`)
    .all(name)

  return rows.map(mapLeaveRequest)
}

export function listAllLeaveRequests({ keyword = '', status = '' } = {}) {
  const q = String(keyword).trim().toLowerCase()
  const like = `%${q}%`
  const statusFilter = String(status).trim()

  const rows = getDb()
    .prepare(
      `${LEAVE_SELECT}
       WHERE (@status = '' OR r.status = @status)
         AND (
           @q = ''
           OR lower(COALESCE(s.name, u.display_name, r.username)) LIKE @like
           OR lower(COALESCE(s.student_no, r.username)) LIKE @like
           OR lower(COALESCE(s.class_name, '')) LIKE @like
         )
       ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END, r.created_at DESC`,
    )
    .all({ status: statusFilter, q, like })

  return rows.map(mapLeaveRequest)
}

export function createLeaveRequest({ username, leaveType, startDate, endDate, reason }) {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()

  getDb()
    .prepare(
      `INSERT INTO leave_requests (
         id, username, leave_type, start_date, end_date, reason, status, created_at
       ) VALUES (
         @id, @username, @leaveType, @startDate, @endDate, @reason, 'pending', @createdAt
       )`,
    )
    .run({
      id,
      username,
      leaveType,
      startDate,
      endDate,
      reason,
      createdAt,
    })

  return getLeaveRequestById(id)
}

export function reviewLeaveRequest(id, { status, reviewRemark, reviewedBy }) {
  const current = getLeaveRequestById(id)
  if (!current) return null

  if (!VALID_LEAVE_STATUS.has(status) || status === 'pending') {
    const error = new Error('审批结果无效')
    error.status = 400
    throw error
  }

  if (current.status === status) {
    const error = new Error('当前已是该状态')
    error.status = 400
    throw error
  }

  const remark = String(reviewRemark ?? '').trim()
  if (status === 'rejected' && !remark) {
    const error = new Error('驳回时请填写原因')
    error.status = 400
    throw error
  }

  getDb()
    .prepare(
      `UPDATE leave_requests
       SET status = @status,
           review_remark = @reviewRemark,
           reviewed_at = @reviewedAt,
           reviewed_by = @reviewedBy
       WHERE id = @id`,
    )
    .run({
      id,
      status,
      reviewRemark: status === 'rejected' ? remark : remark || null,
      reviewedAt: new Date().toISOString(),
      reviewedBy,
    })

  return getLeaveRequestById(id)
}
