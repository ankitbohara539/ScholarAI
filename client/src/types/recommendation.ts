import type { University } from '@/types/university'

export interface RecommendationItem {
  university: University
  score: number
  ml_score: number
  match: MatchResult
  cost: CostEstimate
  rank: number
  category: 'reach' | 'target' | 'safety'
}

export type MatchCriterionStatus = 'available' | 'unknown' | 'not_applicable'
export interface MatchCriterion { status: MatchCriterionStatus; score: number | null; weight: number; reason: string }
export interface MatchResult { match_score: number | null; coverage: number; available_criteria: number; total_criteria: number; breakdown: Record<'gpa' | 'test' | 'budget' | 'program', MatchCriterion> }
export interface CostEstimate { tuition: number | null; living_cost: number | null; application_fee: number | null; potential_aid: number | null; estimated_total: number | null; currency: string | null; missing_fields: string[] }
export interface SimulationInput { gpa?: number; gre_score?: number; budget?: number; budget_currency?: string; top_k?: number }

export interface RecommendationList {
  generation_id: string | null
  model_version: string | null
  generated_at: string | null
  recommendations: RecommendationItem[]
}
