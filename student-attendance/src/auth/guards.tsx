import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { ReactNode } from 'react'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}
