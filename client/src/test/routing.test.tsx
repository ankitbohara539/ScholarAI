import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { RoleRoute } from '@/components/RoleRoute'
import { useAuth } from '@/hooks/useAuth'
import type { AuthContextValue } from '@/types/auth'

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }))
const mockedUseAuth = vi.mocked(useAuth)

function auth(role: 'student' | 'admin' | null): AuthContextValue {
  return {
    user: role ? { id: 1, full_name: 'Test User', profile_picture_url: null, email: 'test@example.com', role, is_active: true, created_at: '' } : null,
    isAuthenticated: role !== null,
    isLoading: false,
    login: vi.fn(), register: vi.fn(), logout: vi.fn(), refreshUser: vi.fn(),
  }
}

describe('protected role routing', () => {
  beforeEach(() => mockedUseAuth.mockReset())

  it('redirects anonymous users to login', () => {
    mockedUseAuth.mockReturnValue(auth(null))
    render(<MemoryRouter initialEntries={['/private']}><Routes><Route path="/login" element={<p>Login</p>} /><Route element={<ProtectedRoute />}><Route path="/private" element={<p>Private</p>} /></Route></Routes></MemoryRouter>)
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('renders a protected route for an authenticated user', () => {
    mockedUseAuth.mockReturnValue(auth('student'))
    render(<MemoryRouter initialEntries={['/private']}><Routes><Route element={<ProtectedRoute />}><Route path="/private" element={<p>Private</p>} /></Route></Routes></MemoryRouter>)
    expect(screen.getByText('Private')).toBeInTheDocument()
  })

  it('redirects a student away from an admin-only route', () => {
    mockedUseAuth.mockReturnValue(auth('student'))
    render(<MemoryRouter initialEntries={['/admin']}><Routes><Route path="/student/dashboard" element={<p>Student dashboard</p>} /><Route element={<RoleRoute allowedRoles={['admin']} />}><Route path="/admin" element={<p>Admin</p>} /></Route></Routes></MemoryRouter>)
    expect(screen.getByText('Student dashboard')).toBeInTheDocument()
  })
})
