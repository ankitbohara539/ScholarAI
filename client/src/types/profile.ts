export type VerificationStatus = 'draft' | 'pending' | 'verified' | 'rejected'

export interface StudentProfile {
  id: number
  user_id: number
  gpa: string | null
  gre_score: number | null
  toefl_score: number | null
  sop_rating: string | null
  lor_rating: string | null
  has_research: boolean | null
  academic_field: string | null
  academic_reputation_preference: number | null
  preferred_country: string | null
  preferred_region: string | null
  preferred_city: string | null
  preferred_degree_level: string | null
  max_tuition_budget: string | null
  preferred_university_type: string | null
  profile_completion_percentage: number
  verification_status: VerificationStatus
  submitted_for_verification_at: string | null
  verified_at: string | null
  verified_by_admin_id: number | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface AcademicProfileInput {
  gpa: number
  gre_score: number
  toefl_score: number
  sop_rating: number
  lor_rating: number
  has_research: boolean
  academic_field: string
  academic_reputation_preference: number
}

export interface PreferenceProfileInput {
  preferred_country: string
  preferred_region: string
  preferred_city: string | null
  preferred_degree_level: string
  max_tuition_budget: number | null
  preferred_university_type: string | null
}
