import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { GuestOnly, RequireAdmin, RequireAuth } from './auth/guards'
import AppLayout from './layouts/AppLayout'
import Home from './pages/Home'
import Attendance from './pages/Attendance'
import Students from './pages/Students'
import Records from './pages/Records'
import Login from './pages/Login'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestOnly>
                <Login />
              </GuestOnly>
            }
          />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Home />} />
            <Route path="attendance" element={<Attendance />} />
            <Route
              path="students"
              element={
                <RequireAdmin>
                  <Students />
                </RequireAdmin>
              }
            />
            <Route path="records" element={<Records />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
