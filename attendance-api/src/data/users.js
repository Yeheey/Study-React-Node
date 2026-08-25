export const users = [
  {
    username: 'admin',
    password: '123456',
    role: 'admin',
    displayName: '管理员',
  },
  {
    username: 'user1',
    password: '123456',
    role: 'user',
    displayName: '普通用户',
  },
]

export function findUserByUsername(username) {
  return users.find((item) => item.username === username)
}

export function toPublicUser(user) {
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
