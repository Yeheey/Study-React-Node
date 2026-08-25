import { getDb } from './index.js'

export function findUserByUsername(username) {
  const name = String(username ?? '').trim()
  if (!name) return null

  const row = getDb()
    .prepare(
      `SELECT username, password, role, display_name AS displayName
       FROM users
       WHERE username = ?`,
    )
    .get(name)

  return row ?? null
}

export const DEFAULT_STUDENT_PASSWORD = '123456'

const RESERVED_USERNAMES = new Set(['admin', 'user1', 'student1'])

export function isReservedUsername(username) {
  return RESERVED_USERNAMES.has(String(username ?? '').trim().toLowerCase())
}

export function createStudentLogin({ username, displayName, password = DEFAULT_STUDENT_PASSWORD }) {
  getDb()
    .prepare(
      `INSERT INTO users (username, password, role, display_name)
       VALUES (@username, @password, 'student', @displayName)`,
    )
    .run({
      username,
      password,
      displayName,
    })
}

export function syncStudentLogin({ oldUsername, username, displayName }) {
  const current = findUserByUsername(oldUsername)
  if (!current || current.role !== 'student') {
    createStudentLogin({ username, displayName })
    return
  }

  if (oldUsername === username) {
    getDb()
      .prepare(`UPDATE users SET display_name = @displayName WHERE username = @username`)
      .run({ username, displayName })
    return
  }

  createStudentLogin({
    username,
    displayName,
    password: current.password,
  })
  getDb()
    .prepare(`UPDATE leave_requests SET username = ? WHERE username = ?`)
    .run(username, oldUsername)
  getDb().prepare(`DELETE FROM users WHERE username = ? AND role = 'student'`).run(oldUsername)
}

export function deleteStudentLogin(username) {
  const name = String(username ?? '').trim()
  if (!name) return
  if (isReservedUsername(name)) return

  getDb().prepare(`DELETE FROM users WHERE username = ? AND role = 'student'`).run(name)
}

export function ensureStudentLogins() {
  const rows = getDb()
    .prepare(`SELECT student_no AS studentNo, name FROM students`)
    .all()

  for (const row of rows) {
    if (isReservedUsername(row.studentNo)) continue
    if (findUserByUsername(row.studentNo)) continue
    createStudentLogin({ username: row.studentNo, displayName: row.name })
  }
}

export function toPublicUser(user) {
  if (!user) return null

  return {
    username: user.username,
    role: user.role,
    displayName: user.displayName,
  }
}

export function createToken(user) {
  return Buffer.from(
    JSON.stringify({ username: user.username, role: user.role }),
  ).toString('base64url')
}

export function parseToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString())
    if (!payload?.username || !payload?.role) return null

    const user = findUserByUsername(payload.username)
    if (!user) return null
    if (user.role !== payload.role) return null

    return toPublicUser(user)
  } catch {
    return null
  }
}
