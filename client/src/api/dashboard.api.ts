import api from '@/api/axios'

export interface StudentDashboardData {
  message: string
  recommended_universities: number
  saved_universities: number
  profile_completion: string
}

export interface AdminDashboardData {
  total_students: number
  active_users: number
  total_universities: number | null
  university_data_status: string
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
