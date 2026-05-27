import type { WinningNumberRow } from '@/app/analysis/chi-square/types';
import type { ConsecutiveRunDistributionRow } from '../types/index';

/** 정렬된 번호 배열에서 인접 차이 1인 구간 중 최장 길이(최소 1) */
function maxConsecutiveRunLength(sorted: readonly number[]): number {
  let maxRun = 1;
  let current = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] === sorted[i] + 1) {
      current++;
    } else {
      if (current > maxRun) maxRun = current;
      current = 1;
    }
  }
  if (current > maxRun) maxRun = current;
  return maxRun;
}

/**
 * 각 회차 주번호 6개(보너스 제외)를 정렬한 뒤 최대 연속 구간 길이를 1~6 버킷별로 집계한다.
 */
export function buildConsecutiveRunDistribution(rows: readonly WinningNumberRow[]): {
  totalDraws: number;
  rows: ConsecutiveRunDistributionRow[];
} {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const row of rows) {
    const mains = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6];
    mains.sort((a, b) => a - b);
    const runLen = maxConsecutiveRunLength(mains);
    counts[runLen]++;
  }
  const totalDraws = rows.length;
  const resultRows: ConsecutiveRunDistributionRow[] = [1, 2, 3, 4, 5, 6].map((maxRunLength) => {
    const drawCount = counts[maxRunLength];
    return {
      maxRunLength: maxRunLength as ConsecutiveRunDistributionRow['maxRunLength'],
      drawCount,
      percentage: totalDraws === 0 ? 0 : Math.round((drawCount / totalDraws) * 10000) / 100,
    };
  });
  return { totalDraws, rows: resultRows };
}
