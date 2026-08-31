import api from '@/api/axios'

export interface StudentDashboardData {
  profile_completion_percentage: number
  verification_status: 'draft' | 'pending' | 'verified' | 'rejected'
  recommendations_available: number
  unread_notifications: number
}

export interface AdminDashboardData {
  total_students: number
  pending_verification: number
  verified_students: number
  suspended_students: number
  total_universities: number
  active_universities: number
}

export const dashboardApi = {
  async student(): Promise<StudentDashboardData> {
    const response = await api.get<StudentDashboardData>('/student/dashboard')
    return response.data
  },
  async admin(): Promise<AdminDashboardData> {
    const response = await api.get<AdminDashboardData>('/admin/dashboard')
    return response.data
  },
}
