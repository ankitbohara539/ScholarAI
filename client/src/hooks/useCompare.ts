import { useContext } from 'react'
import { CompareContext } from '@/context/compare-context'

export function useCompare() { const value = useContext(CompareContext); if (!value) throw new Error('useCompare must be used inside CompareProvider'); return value }
