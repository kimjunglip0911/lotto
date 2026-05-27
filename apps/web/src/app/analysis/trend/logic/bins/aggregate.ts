import { K_TREND, TOTAL_NUMBERS } from '../../constants/trendChart';
import type { DeviationBinRow, DeviationBinsSummary, WinningNumberRow } from '../../types';
import { BIN_KEY_TO_LABEL, MIN_BASELINE, ORDERED_BIN_KEYS, resolveBinKey } from './binDefs';

const mainSix = (row: WinningNumberRow): readonly number[] => [
  row.num1,
  row.num2,
  row.num3,
  row.num4,
  row.num5,
  row.num6,
];

export type AggregateDeviationBinsOptions = {
  minDraw?: number;
  maxDraw?: number;
  kTrend?: number;
};

export const aggregateDeviationBins = (
  rows: readonly WinningNumberRow[],
  options: AggregateDeviationBinsOptions = {},
): DeviationBinsSummary => {
  const minDraw = options.minDraw ?? 1;
  const k = options.kTrend ?? K_TREND;
  const sorted = [...rows].sort((a, b) => a.draw_no - b.draw_no);
  const maxDraw =
    options.maxDraw ?? (sorted.length === 0 ? minDraw : Math.max(...sorted.map((r) => r.draw_no)));

  const drawCounts = new Map<string, number>();
  const winningHitDrawCounts = new Map<string, number>();
  for (const key of ORDERED_BIN_KEYS) {
    drawCounts.set(key, 0);
    winningHitDrawCounts.set(key, 0);
  }

  let validDrawCount = 0;
  let skippedDrawCount = 0;
  const emaByNum = new Float64Array(TOTAL_NUMBERS);
  let mainHitsInPrefix = 0;
  let drawsInPrefix = 0;

  for (const row of sorted) {
    const d = row.draw_no;
    if (d >= minDraw && d <= maxDraw) {
      const baseline = drawsInPrefix > 0 ? mainHitsInPrefix / (drawsInPrefix * TOTAL_NUMBERS) : 0;
      if (drawsInPrefix === 0 || baseline < MIN_BASELINE) {
        skippedDrawCount += 1;
      } else {
        validDrawCount += 1;
        const presentBinKeys = new Set<string>();
        const winningHitBinKeys = new Set<string>();
        const winningNumSet = new Set(mainSix(row).filter((n) => n >= 1 && n <= TOTAL_NUMBERS));
        for (let n = 1; n <= TOTAL_NUMBERS; n += 1) {
          const ema = emaByNum[n - 1]!;
          const key = resolveBinKey((ema - baseline) * 100);
          presentBinKeys.add(key);
          if (winningNumSet.has(n)) winningHitBinKeys.add(key);
        }
        for (const key of presentBinKeys) {
          drawCounts.set(key, (drawCounts.get(key) ?? 0) + 1);
        }
        for (const key of winningHitBinKeys) {
          winningHitDrawCounts.set(key, (winningHitDrawCounts.get(key) ?? 0) + 1);
        }
      }
    }
    for (let n = 1; n <= TOTAL_NUMBERS; n += 1) {
      const signal = mainSix(row).includes(n) ? 1 : 0;
      emaByNum[n - 1] = signal * k + emaByNum[n - 1]! * (1 - k);
    }
    for (const num of mainSix(row)) {
      if (num >= 1 && num <= TOTAL_NUMBERS) mainHitsInPrefix += 1;
    }
    drawsInPrefix += 1;
  }

  const rowsOut: DeviationBinRow[] = ORDERED_BIN_KEYS.map((key) => {
    const drawCount = drawCounts.get(key) ?? 0;
    const winningHitDrawCount = winningHitDrawCounts.get(key) ?? 0;
    return {
      key,
      label: BIN_KEY_TO_LABEL.get(key) ?? key,
      drawCount,
      winningHitDrawCount,
      appearanceProbability: drawCount > 0 ? (winningHitDrawCount / drawCount) * 100 : 0,
    };
  });

  return { rows: rowsOut, validDrawCount, skippedDrawCount };
};
