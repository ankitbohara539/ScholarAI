import { createContext } from 'react'
import type { University } from '@/types/university'

export interface ComparisonItem {
  university: University
  matchScore: number | null
  mlScore: number | null
  programMatch: number | null
  estimatedTotal: number | null
}

export interface CompareContextValue {
  items: ComparisonItem[]
  add: (item: ComparisonItem) => boolean
  remove: (universityId: number) => void
  contains: (universityId: number) => boolean
  clear: () => void
}

export const CompareContext = createContext<CompareContextValue | null>(null)
