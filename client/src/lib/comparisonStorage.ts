export const comparisonStorageKey = (userId: number) =>
  `university_compare:${userId}`;

export function readComparisonIds(userId: number): number[] {
  try {
    const value: unknown = JSON.parse(
      sessionStorage.getItem(comparisonStorageKey(userId)) ?? "[]",
    );
    return Array.isArray(value)
      ? value
          .filter((item): item is number => Number.isInteger(item) && item > 0)
          .slice(0, 3)
      : [];
  } catch {
    return [];
  }
}
