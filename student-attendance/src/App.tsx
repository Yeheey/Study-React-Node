import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { GuestOnly, RequireAdmin, RequireAuth, RequireStaff, RequireStudent } from './auth/guards'
import AppLayout from './layouts/AppLayout'
import Home from './pages/Home'
import Attendance from './pages/Attendance'
import Students from './pages/Students'
import Records from './pages/Records'
import Leave from './pages/Leave'
import LeaveReview from './pages/LeaveReview'
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
            <Route
              index
              element={
                <RequireStaff>
                  <Home />
                </RequireStaff>
              }
            />
            <Route
              path="attendance"
              element={
                <RequireStaff>
                  <Attendance />
                </RequireStaff>
              }
            />
            <Route
              path="students"
              element={
                <RequireAdmin>
                  <Students />
                </RequireAdmin>
              }
            />
            <Route
              path="leave-review"
              element={
                <RequireAdmin>
                  <LeaveReview />
                </RequireAdmin>
              }
            />
            <Route
              path="records"
              element={
                <RequireStaff>
                  <Records />
                </RequireStaff>
              }
            />
            <Route
              path="leave"
              element={
                <RequireStudent>
                  <Leave />
                </RequireStudent>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
