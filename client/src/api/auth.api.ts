import api from '@/api/axios'
import type { AuthResponse, LoginCredentials, RegisterData } from '@/types/auth'
import type { User } from '@/types/user'

export const authApi = {
  async register(data: RegisterData): Promise<User> {
    const response = await api.post<User>('/auth/register', data)
    return response.data
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials)
    return response.data
  },

  async me(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    return response.data
  },
}
