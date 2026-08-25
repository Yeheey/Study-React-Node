import type { AuthSession } from '../types'

const STORAGE_KEY = 'oldpang-auth'

export function getStoredAuth(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.token || !parsed?.user?.username || !parsed?.user?.role) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function setStoredAuth(session: AuthSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY)
}
