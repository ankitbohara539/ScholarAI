import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { CompareContext, type CompareContextValue } from '@/context/compare-context'
import type { ComparisonItem } from '@/context/compare-context'

const STORAGE_KEY = 'scholarai:comparison'

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ComparisonItem[]>(() => { try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]') as ComparisonItem[] } catch { return [] } })
  const save = useCallback((next: ComparisonItem[]) => { setItems(next); sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)) }, [])
  const add = useCallback((item: ComparisonItem) => { if (items.some((value) => value.university.id === item.university.id)) return true; if (items.length >= 3) return false; save([...items, item]); return true }, [items, save])
  const remove = useCallback((id: number) => save(items.filter((item) => item.university.id !== id)), [items, save])
  const contains = useCallback((id: number) => items.some((item) => item.university.id === id), [items])
  const clear = useCallback(() => save([]), [save])
  const value = useMemo<CompareContextValue>(() => ({ items, add, remove, contains, clear }), [items, add, remove, contains, clear])
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}
