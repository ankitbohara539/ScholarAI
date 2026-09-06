export interface University {
  id: number
  name: string
  country: string
  region: string
  city: string | null
  website_url: string | null
  ranking: number
  academic_reputation_score: string
  minimum_gpa: string | null
  minimum_gre_score: number | null
  tuition_fee: string | null
  estimated_living_cost: string | null
  application_fee: string | null
  currency: string | null
  acceptance_rate: string | null
  programs: string[] | null
  university_type: string | null
  degree_levels: string[] | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  scholarships: Scholarship[]
}

export interface Scholarship {
  id: number
  university_id: number
  name: string
  amount: string
  minimum_gpa: string | null
  minimum_test_score: number | null
  eligibility_description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UniversityInput {
  name: string
  country: string
  region: string
  city?: string | null
  website_url?: string | null
  ranking: number
  academic_reputation_score: number
  minimum_gpa?: number | null
  minimum_gre_score?: number | null
  tuition_fee?: number | null
  estimated_living_cost?: number | null
  application_fee?: number | null
  currency?: string | null
  acceptance_rate?: number | null
  programs?: string[] | null
  university_type?: string | null
  degree_levels?: string[] | null
  description?: string | null
  is_active?: boolean
}

export interface Page<T> {
  items: T[]
  page: number
  page_size: number
  total: number
  pages: number
}
