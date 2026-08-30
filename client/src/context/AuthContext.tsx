import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { AUTH_UNAUTHORIZED_EVENT } from '@/api/axios'
import { authApi } from '@/api/auth.api'
import { tokenStorage } from '@/api/token'
import { AuthContext } from '@/context/auth-context'
import type { AuthContextValue, LoginCredentials, RegisterData } from '@/types/auth'
import type { User } from '@/types/user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async (): Promise<User | null> => {
    if (!tokenStorage.get()) {
      setUser(null)
      return null
    }
    try {
      const currentUser = await authApi.me()
      setUser(currentUser)
      return currentUser
    } catch {
      tokenStorage.clear()
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    void refreshUser().finally(() => setIsLoading(false))
  }, [refreshUser])

  useEffect(() => {
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, logout)
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, logout)
  }, [logout])

  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    const response = await authApi.login(credentials)
    tokenStorage.set(response.access_token)
    setUser(response.user)
    return response.user
  }, [])

  const register = useCallback(
    async (data: RegisterData): Promise<User> => {
      await authApi.register(data)
      return login({ email: data.email, password: data.password })
    },
    [login],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
