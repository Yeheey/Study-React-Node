import { fail } from '../utils/helpers.js'
import { parseToken } from '../db/users.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) {
    return fail(res, '未登录', 401, 401)
  }

  const user = parseToken(header.slice(7))
  if (!user) {
    return fail(res, '登录已失效，请重新登录', 401, 401)
  }

  req.user = user
  return next()
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return fail(res, '无权限执行该操作', 403, 403)
  }

  return next()
}

export function requireStudent(req, res, next) {
  if (req.user?.role !== 'student') {
    return fail(res, '无权限执行该操作', 403, 403)
  }

  return next()
}
