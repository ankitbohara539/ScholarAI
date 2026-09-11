import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CompareContext,
  type CompareContextValue,
} from "@/context/compare-context";
import { useAuth } from "@/hooks/useAuth";
import { comparisonStorageKey, readComparisonIds } from "@/lib/comparisonStorage";

export function CompareProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [universityIds, setUniversityIds] = useState<number[]>([]);

  useEffect(() => {
    setUniversityIds(userId ? readComparisonIds(userId) : []);
  }, [userId]);

  const save = useCallback(
    (next: number[]) => {
      setUniversityIds(next);
      if (userId)
        sessionStorage.setItem(comparisonStorageKey(userId), JSON.stringify(next));
    },
    [userId],
  );

  const add = useCallback(
    (id: number) => {
      if (universityIds.includes(id)) return true;
      if (universityIds.length >= 3) return false;
      save([...universityIds, id]);
      return true;
    },
    [save, universityIds],
  );

  const remove = useCallback(
    (id: number) => {
      save(universityIds.filter((value) => value !== id));
    },
    [save, universityIds],
  );

  const contains = useCallback(
    (id: number) => universityIds.includes(id),
    [universityIds],
  );
  const clear = useCallback(() => save([]), [save]);
  const value = useMemo<CompareContextValue>(
    () => ({ universityIds, add, remove, contains, clear }),
    [universityIds, add, remove, contains, clear],
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}
