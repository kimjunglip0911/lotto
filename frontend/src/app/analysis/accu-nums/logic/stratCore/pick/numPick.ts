import type { AccumulatedStrategyKey } from '../types';
import { countAt, sortByCountAscThenNumberAsc, sortByCountDescThenNumberAsc } from './numPickSort';

/** 전략 이름에 맞춰 “이번에 쓸 4개 번호”를 뽑고, 실제 당첨과 몇 개 겹쳤는지 센다. */

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
