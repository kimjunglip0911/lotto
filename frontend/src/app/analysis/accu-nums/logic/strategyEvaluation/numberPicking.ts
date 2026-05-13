import type { AccumulatedStrategyKey } from './types';

const countAt = (counts: number[], number1To45: number): number =>
  counts[number1To45 - 1] ?? 0;

/** 출현 횟수 내림차순, 동률이면 번호 오름차순 */
function sortByCountDescThenNumberAsc(counts: number[]): { number: number; count: number }[] {
  return Array.from({ length: 45 }, (_, i) => ({
    number: i + 1,
    count: countAt(counts, i + 1),
  })).sort((a, b) => b.count - a.count || a.number - b.number);
}

/** 출현 횟수 오름차순, 동률이면 번호 오름차순 */
function sortByCountAscThenNumberAsc(counts: number[]): { number: number; count: number }[] {
  return Array.from({ length: 45 }, (_, i) => ({
    number: i + 1,
    count: countAt(counts, i + 1),
  })).sort((a, b) => a.count - b.count || a.number - b.number);
}

export function pickTop4ByFrequency(counts: number[]): number[] {
  return sortByCountDescThenNumberAsc(counts)
    .slice(0, 4)
    .map((e) => e.number);
}

export function pickBottom4ByFrequency(counts: number[]): number[] {
  return sortByCountAscThenNumberAsc(counts)
    .slice(0, 4)
    .map((e) => e.number);
}

export function pickNearestMean4(counts: number[]): number[] {
  const total = counts.reduce((s, c) => s + c, 0);
  const mean = total / 45;
  const scored = Array.from({ length: 45 }, (_, i) => {
    const number = i + 1;
    const c = countAt(counts, number);
    return { number, diff: Math.abs(c - mean) };
  });
  scored.sort((a, b) => a.diff - b.diff || a.number - b.number);
  return scored.slice(0, 4).map((e) => e.number);
}

export function pickTwoHotTwoCold(counts: number[]): number[] {
  const desc = sortByCountDescThenNumberAsc(counts);
  const asc = sortByCountAscThenNumberAsc(counts);
  const picked = new Set<number>();
  for (const e of desc) {
    if (picked.size >= 2) break;
    picked.add(e.number);
  }
  for (const e of asc) {
    if (picked.size >= 4) break;
    if (!picked.has(e.number)) {
      picked.add(e.number);
    }
  }
  // 이론상 45개 중 4개 미만이 될 수 없음 — 안전하게 부족하면 desc 순으로 채움
  for (const e of desc) {
    if (picked.size >= 4) break;
    picked.add(e.number);
  }
  return [...picked].sort((a, b) => a - b).slice(0, 4);
}

export function pickFourByStrategy(counts: number[], strategy: AccumulatedStrategyKey): number[] {
  switch (strategy) {
    case 'top4Frequency':
      return pickTop4ByFrequency(counts);
    case 'bottom4Frequency':
      return pickBottom4ByFrequency(counts);
    case 'nearestMean4':
      return pickNearestMean4(counts);
    case 'twoHotTwoCold':
      return pickTwoHotTwoCold(counts);
  }
}

export function countMainHits(predictedFour: number[], actualMainSix: number[]): number {
  const actual = new Set(actualMainSix);
  return predictedFour.reduce((acc, n) => acc + (actual.has(n) ? 1 : 0), 0);
}
