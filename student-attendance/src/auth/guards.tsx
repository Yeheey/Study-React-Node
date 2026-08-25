import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { homePath } from './paths'
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
  const { isAdmin, user } = useAuth()

  if (!isAdmin) {
    return <Navigate to={homePath(user?.role)} replace />
  }

  return children
}

export function RequireStudent({ children }: { children: ReactNode }) {
  const { isStudent, user } = useAuth()

  if (!isStudent) {
    return <Navigate to={homePath(user?.role)} replace />
  }

  return children
}

export function RequireStaff({ children }: { children: ReactNode }) {
  const { isStudent, user } = useAuth()

  if (isStudent) {
    return <Navigate to={homePath(user?.role)} replace />
  }

  return children
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  if (user) {
    return <Navigate to={homePath(user.role)} replace />
  }

  return children
}
