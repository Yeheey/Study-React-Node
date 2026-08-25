import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { login as loginRequest } from '../api'
import { clearStoredAuth, getStoredAuth, setStoredAuth } from './session'
import type { AuthUser } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  isAdmin: boolean
  isStudent: boolean
  login: (username: string, password: string) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuth()?.user ?? null)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAdmin: user?.role === 'admin',
      isStudent: user?.role === 'student',
      async login(username: string, password: string) {
        const session = await loginRequest({ username, password })
        setStoredAuth(session)
        setUser(session.user)
        return session.user
      },
      logout() {
        clearStoredAuth()
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth 必须在 AuthProvider 内使用')
  }
  return ctx
}
