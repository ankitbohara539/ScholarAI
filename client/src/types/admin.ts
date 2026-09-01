import type { Page } from '@/types/university'
import type { StudentProfile, VerificationStatus } from '@/types/profile'

export interface AdminStudent {
  id: number
  full_name: string
  email: string
  profile_completion_percentage: number
  verification_status: VerificationStatus
  account_status: 'active' | 'suspended'
  created_at: string
}

export type AdminStudentPage = Page<AdminStudent>

export interface AdminStudentDetail {
  id: number
  full_name: string
  email: string
  account_status: 'active' | 'suspended'
  created_at: string
  profile: StudentProfile | null
}
