import { countAt, sortByCountAscThenNumberAsc, sortByCountDescThenNumberAsc } from './numPickSort';

/** 평균 출현에 가장 가까운 번호 4개. */
export const pickNearestMean4 = (counts: number[]): number[] => {
  const total = counts.reduce((s, c) => s + c, 0);
  const mean = total / 45;
  const scored = Array.from({ length: 45 }, (_, i) => {
    const number = i + 1;
    const c = countAt(counts, number);
    return { number, diff: Math.abs(c - mean) };
  });
  scored.sort((a, b) => a.diff - b.diff || a.number - b.number);
  return scored.slice(0, 4).map((e) => e.number);
};

/** 상위 2·하위 2 출현 번호를 섞어 4개를 고른다. */
export const pickTwoHotTwoCold = (counts: number[]): number[] => {
  const desc = sortByCountDescThenNumberAsc(counts);
  const asc = sortByCountAscThenNumberAsc(counts);
  const picked = new Set<number>();
  for (const e of desc) {
    if (picked.size >= 2) break;
    picked.add(e.number);
  }
  for (const e of asc) {
    if (picked.size >= 4) break;
    if (!picked.has(e.number)) picked.add(e.number);
  }
  for (const e of desc) {
    if (picked.size >= 4) break;
    picked.add(e.number);
  }
  return [...picked].sort((a, b) => a - b).slice(0, 4);
};
