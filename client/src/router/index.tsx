import { Navigate, createBrowserRouter } from 'react-router-dom'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PublicOnlyRoute } from '@/components/PublicOnlyRoute'
import { RoleRoute } from '@/components/RoleRoute'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { StudentDashboard } from '@/pages/student/StudentDashboard'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { element: <PublicOnlyRoute />, children: [
    { path: '/login', element: <LoginPage /> },
    { path: '/register', element: <RegisterPage /> },
  ] },
  { element: <ProtectedRoute />, children: [
    { element: <RoleRoute allowedRoles={['student']} />, children: [
      { path: '/student/dashboard', element: <StudentDashboard /> },
    ] },
    { element: <RoleRoute allowedRoles={['admin']} />, children: [
      { path: '/admin/dashboard', element: <AdminDashboard /> },
    ] },
  ] },
  { path: '*', element: <NotFoundPage /> },
])
