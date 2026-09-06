import api from '@/api/axios'
import type { User } from '@/types/user'

export const accountApi = {
  async get(): Promise<User> { return (await api.get<User>('/profile')).data },
  async update(fullName: string): Promise<User> { return (await api.patch<User>('/profile', { full_name: fullName })).data },
  async uploadAvatar(file: File): Promise<User> {
    const data = new FormData()
    data.append('avatar', file)
    return (await api.post<User>('/profile/avatar', data, { headers: { 'Content-Type': 'multipart/form-data' } })).data
  },
  async removeAvatar(): Promise<User> { return (await api.delete<User>('/profile/avatar')).data },
}
