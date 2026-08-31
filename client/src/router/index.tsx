import { Navigate, createBrowserRouter } from 'react-router-dom'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PublicOnlyRoute } from '@/components/PublicOnlyRoute'
import { RoleRoute } from '@/components/RoleRoute'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { element: <PublicOnlyRoute />, children: [
    { path: '/login', lazy: async () => ({ Component: (await import('@/pages/auth/LoginPage')).LoginPage }) },
    { path: '/register', lazy: async () => ({ Component: (await import('@/pages/auth/RegisterPage')).RegisterPage }) },
  ] },
  { element: <ProtectedRoute />, children: [
    { element: <RoleRoute allowedRoles={['student']} />, children: [
      { path: '/student/dashboard', lazy: async () => ({ Component: (await import('@/pages/student/StudentDashboard')).StudentDashboard }) },
      { path: '/student/profile', lazy: async () => ({ Component: (await import('@/pages/student/ProfilePage')).ProfilePage }) },
      { path: '/student/universities', lazy: async () => ({ Component: (await import('@/pages/student/UniversitiesPage')).UniversitiesPage }) },
      { path: '/student/recommendations', lazy: async () => ({ Component: (await import('@/pages/student/RecommendationsPage')).RecommendationsPage }) },
    ] },
    { element: <RoleRoute allowedRoles={['admin']} />, children: [
      { path: '/admin/dashboard', lazy: async () => ({ Component: (await import('@/pages/admin/AdminDashboard')).AdminDashboard }) },
      { path: '/admin/students', lazy: async () => ({ Component: (await import('@/pages/admin/StudentsPage')).StudentsPage }) },
      { path: '/admin/universities', lazy: async () => ({ Component: (await import('@/pages/admin/UniversitiesPage')).AdminUniversitiesPage }) },
    ] },
  ] },
  { path: '*', lazy: async () => ({ Component: (await import('@/pages/NotFoundPage')).NotFoundPage }) },
])
