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
