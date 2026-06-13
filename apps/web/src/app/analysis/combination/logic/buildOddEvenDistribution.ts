import type { WinningNumberRow } from '@/app/analysis/accu-nums/types';
import type { OddEvenDistributionRow } from '../types/index';

/**
 * 각 회차 주번호 6개에서 짝수 개수를 세어 0~6 버킷별 건수·비율(%)을 계산한다. 보너스는 제외한다.
 */
export function buildOddEvenDistribution(rows: readonly WinningNumberRow[]): {
  totalDraws: number;
  rows: OddEvenDistributionRow[];
} {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const row of rows) {
    const mains = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6];
    const evenCount = mains.filter((n) => n % 2 === 0).length;
    counts[evenCount]++;
  }
  const totalDraws = rows.length;
  const resultRows: OddEvenDistributionRow[] = counts.map((drawCount, evenCount) => ({
    evenCount,
    drawCount,
    percentage: totalDraws === 0 ? 0 : Math.round((drawCount / totalDraws) * 10000) / 100,
  }));
  return { totalDraws, rows: resultRows };
}
