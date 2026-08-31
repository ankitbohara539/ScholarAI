import api from '@/api/axios'
import type { AcademicProfileInput, PreferenceProfileInput, StudentProfile } from '@/types/profile'

export const profileApi = {
  async get(): Promise<StudentProfile> { return (await api.get<StudentProfile>('/student/profile')).data },
  async saveAcademic(data: AcademicProfileInput): Promise<StudentProfile> { return (await api.patch<StudentProfile>('/student/profile/academic', data)).data },
  async savePreferences(data: PreferenceProfileInput): Promise<StudentProfile> { return (await api.patch<StudentProfile>('/student/profile/preferences', data)).data },
  async submit(): Promise<StudentProfile> { return (await api.post<StudentProfile>('/student/profile/submit-verification')).data },
}
