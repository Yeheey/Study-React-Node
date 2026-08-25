import { Router } from 'express'
import { createToken, findUserByUsername, toPublicUser } from '../data/users.js'
import { fail, ok } from '../utils/helpers.js'

const router = Router()

router.post('/login', (req, res) => {
  const username = String(req.body?.username ?? '').trim()
  const password = String(req.body?.password ?? '')

  if (!username || !password) {
    return fail(res, '请输入用户名和密码')
  }

  const user = findUserByUsername(username)
  if (!user || user.password !== password) {
    return fail(res, '用户名或密码错误', 1, 401)
  }

  return ok(res, {
    token: createToken(user),
    user: toPublicUser(user),
  })
})

export default router
