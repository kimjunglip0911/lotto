/**
 * 회차별로 이력(draw_no < 해당 회차)만 반영한 기댓값·EMA와 동일 정의로,
 * 번호별 (EMA−기댓값)/기댓값×100 을 10%p 구간으로 나눠 회차 기준 출현확률을 집계한다.
 *
 * 회차 단위 계산:
 * - drawCount: 해당 구간이 그 회차에 1번 이상 나타난 횟수
 * - winningHitDrawCount: 위 회차 중 실제 당첨 주6(보너스 제외)가 해당 구간에 포함된 횟수
 * - appearanceProbability: winningHitDrawCount / drawCount * 100
 *
 * 기댓값이 매우 작을 때: `MIN_BASELINE` 미만이면 해당 회차는 건너뛰고 `skippedDrawCount`에만 반영한다.
 * 꼬리 구간: pct < -100 → "< -100%", pct ≥ 100 → "≥ 100%", 그 외 [-100,100) 에서 10%p 단위 반개구간.
 */
import { K_TREND, TOTAL_NUMBERS } from '../constants';
import type { DeviationBinRow, DeviationBinsSummary, WinningNumberRow } from '../types';

/** 기댓값이 이 값 미만이면 편차%가 불안정해 표본에서 제외한다 */
export const MIN_BASELINE = 1e-10;

const mainSix = (row: WinningNumberRow): readonly number[] => [
  row.num1,
  row.num2,
  row.num3,
  row.num4,
  row.num5,
  row.num6,
];

/** 구간 표시 순서를 고정하기 위한 키·라벨 목록(중간 구간만) */
const buildInteriorBinDefs = (): readonly { key: string; label: string; lo: number }[] => {
  const defs: { key: string; label: string; lo: number }[] = [];
  for (let lo = -100; lo < 100; lo += 10) {
    defs.push({
      key: `mid_${lo}`,
      label: `${lo}~${lo + 10}%`,
      lo,
    });
  }
  return defs;
};

const INTERIOR_DEFS = buildInteriorBinDefs();

const ORDERED_KEYS: readonly string[] = [
  'tail_low',
  ...INTERIOR_DEFS.map((d) => d.key),
  'tail_high',
];

const KEY_TO_LABEL = ((): Map<string, string> => {
  const m = new Map<string, string>();
  m.set('tail_low', '< -100%');
  for (const d of INTERIOR_DEFS) {
    m.set(d.key, d.label);
  }
  m.set('tail_high', '≥ 100%');
  return m;
})();

const resolveBinKey = (pct: number): string => {
  if (pct < -100) return 'tail_low';
  if (pct >= 100) return 'tail_high';
  const lo = Math.floor(pct / 10) * 10;
  return `mid_${lo}`;
};

export type AggregateDeviationBinsOptions = {
  /** 표본에 넣을 최소 회차(기본 1 — 전체 이력) */
  minDraw?: number;
  /** 표본에 넣을 최대 회차(미지정 시 rows 중 최대 draw_no) */
  maxDraw?: number;
  /** EMA k (기본 K_TREND) */
  kTrend?: number;
};

/**
 * draw_no 오름차순으로 정렬된 당첨 이력을 받아, 각 회차 직전까지의 prefix로
 * 기댓값·EMA를 증분 갱신하며 구간별 표본 수를 센다.
 */
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
  for (const key of ORDERED_KEYS) {
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
          const pct = ((ema - baseline) / baseline) * 100;
          const key = resolveBinKey(pct);
          presentBinKeys.add(key);

          if (winningNumSet.has(n)) {
            winningHitBinKeys.add(key);
          }
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

  const rowsOut: DeviationBinRow[] = ORDERED_KEYS.map((key) => {
    const drawCount = drawCounts.get(key) ?? 0;
    const winningHitDrawCount = winningHitDrawCounts.get(key) ?? 0;
    return {
      key,
      label: KEY_TO_LABEL.get(key) ?? key,
      drawCount,
      winningHitDrawCount,
      appearanceProbability: drawCount > 0 ? (winningHitDrawCount / drawCount) * 100 : 0,
    };
  });

  return {
    rows: rowsOut,
    validDrawCount,
    skippedDrawCount,
  };
};
