/** API 회차 목록 응답을 정수 회차 배열(내림차순·중복 제거)로 정규화한다. */
export const normalizeDrawNumbers = (payload: unknown): number[] => {
  if (!Array.isArray(payload)) return [];

  const normalized = payload
    .map((item) => {
      if (typeof item === 'number') return item;
      if (typeof item === 'string') {
        const parsed = Number(item.trim());
        return Number.isNaN(parsed) ? null : parsed;
      }
      return null;
    })
    .filter((item): item is number => item !== null && Number.isInteger(item) && item > 0);

  return [...new Set(normalized)].sort((a, b) => b - a);
};
