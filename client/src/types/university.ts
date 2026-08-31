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
  application_fee: string | null
  university_type: string | null
  degree_levels: string[] | null
  description: string | null
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
  application_fee?: number | null
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
