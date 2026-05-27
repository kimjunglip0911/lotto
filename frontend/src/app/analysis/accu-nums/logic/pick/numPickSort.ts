/** 1~45�?각각??출현 ?�수 배열??번호 ?�으�??�렬?? ?�·하???�보�?고�? ???�다. */

export const countAt = (counts: number[], number1To45: number): number =>
  counts[number1To45 - 1] ?? 0;

/** 출현 ?�수 ?�림차순, ?�률?�면 번호 ?�름차순 */
export function sortByCountDescThenNumberAsc(counts: number[]): { number: number; count: number }[] {
  return Array.from({ length: 45 }, (_, i) => ({
    number: i + 1,
    count: countAt(counts, i + 1),
  })).sort((a, b) => b.count - a.count || a.number - b.number);
}

/** 출현 ?�수 ?�름차순, ?�률?�면 번호 ?�름차순 */
export function sortByCountAscThenNumberAsc(counts: number[]): { number: number; count: number }[] {
  return Array.from({ length: 45 }, (_, i) => ({
    number: i + 1,
    count: countAt(counts, i + 1),
  })).sort((a, b) => a.count - b.count || a.number - b.number);
}
