import type { University } from '@/types/university'

export interface RecommendationItem {
  university: University
  score: number
  rank: number
  category: 'reach' | 'target' | 'safety'
}

export interface RecommendationList {
  generation_id: string | null
  model_version: string | null
  generated_at: string | null
  recommendations: RecommendationItem[]
}
