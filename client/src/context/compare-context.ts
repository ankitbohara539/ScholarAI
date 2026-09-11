import { createContext } from 'react'

export interface CompareContextValue {
  universityIds: number[]
  add: (universityId: number) => boolean
  remove: (universityId: number) => void
  contains: (universityId: number) => boolean
  clear: () => void
}

export const CompareContext = createContext<CompareContextValue | null>(null)
