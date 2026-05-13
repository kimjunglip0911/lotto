/** 1~45번 각각의 출현 횟수 배열을 번호 순으로 정렬해, 상·하위 후보를 고를 때 쓴다. */

export const countAt = (counts: number[], number1To45: number): number =>
  counts[number1To45 - 1] ?? 0;

/** 출현 횟수 내림차순, 동률이면 번호 오름차순 */
export function sortByCountDescThenNumberAsc(counts: number[]): { number: number; count: number }[] {
  return Array.from({ length: 45 }, (_, i) => ({
    number: i + 1,
    count: countAt(counts, i + 1),
  })).sort((a, b) => b.count - a.count || a.number - b.number);
}

/** 출현 횟수 오름차순, 동률이면 번호 오름차순 */
export function sortByCountAscThenNumberAsc(counts: number[]): { number: number; count: number }[] {
  return Array.from({ length: 45 }, (_, i) => ({
    number: i + 1,
    count: countAt(counts, i + 1),
  })).sort((a, b) => a.count - b.count || a.number - b.number);
}
