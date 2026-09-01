import api from '@/api/axios'
import type { AdminStudentDetail, AdminStudentPage } from '@/types/admin'
import type { Notification } from '@/types/notification'
import type { VerificationStatus } from '@/types/profile'

export interface StudentFilters {
  page?: number
  page_size?: number
  search?: string
  verification_status?: VerificationStatus
  account_status?: 'active' | 'suspended'
}

export const adminStudentsApi = {
  async list(filters: StudentFilters = {}): Promise<AdminStudentPage> { return (await api.get<AdminStudentPage>('/admin/students', { params: filters })).data },
  async get(id: number): Promise<AdminStudentDetail> { return (await api.get<AdminStudentDetail>(`/admin/students/${id}`)).data },
  async verify(id: number): Promise<Notification> { return (await api.post<Notification>(`/admin/students/${id}/verify`)).data },
  async reject(id: number, reason: string): Promise<Notification> { return (await api.post<Notification>(`/admin/students/${id}/reject`, { reason })).data },
  async suspend(id: number): Promise<Notification> { return (await api.post<Notification>(`/admin/students/${id}/suspend`)).data },
  async reactivate(id: number): Promise<Notification> { return (await api.post<Notification>(`/admin/students/${id}/reactivate`)).data },
  async remove(id: number): Promise<void> { await api.delete(`/admin/students/${id}`) },
}
