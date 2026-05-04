import type { NumberTrendResult } from '../types';

type Scored = { number: number; deltaPp: number };

/** 표 기대값 대비와 동일 스케일에서 구간 포함 판단(부동소수 경계 흔들림 완화) */
function inDeltaPpRange(deltaPp: number, min: number, max: number): boolean {
  return deltaPp >= min - 1e-9 && deltaPp <= max + 1e-9;
}

function sortFillOrder(a: Scored, b: Scored): number {
  return a.deltaPp - b.deltaPp || a.number - b.number;
}

/** +3%p에 가까운 순, 동률 시 번호 오름차순 */
function sortProximityToPositive3(a: Scored, b: Scored): number {
  const da = Math.abs(a.deltaPp - 3);
  const db = Math.abs(b.deltaPp - 3);
  return da - db || a.number - b.number;
}

/**
 * 누적·카이제곱에서 나온 번호는 `exclude`로 빼고, 기대값 대비(Slow EMA − baseline) %p 기준으로 4개를 고른다.
 * 순서: +2.0~+3.9 → (부족 시) +0.0~+0.9. 첫 구간 후보가 4 초과면 +3%p에 가까운 4개만.
 */
export function pickTrendRecommendedFour(
  trendResults: NumberTrendResult[],
  exclude: ReadonlySet<number>,
  baseline: number
): readonly [number, number, number, number] | null {
  const scored: Scored[] = trendResults
    .filter((r) => !exclude.has(r.number))
    .map((r) => ({ number: r.number, deltaPp: (r.emaSlow - baseline) * 100 }));

  const tierFirst = scored.filter((s) => inDeltaPpRange(s.deltaPp, 2.0, 3.9));
  let chosen: Scored[] = [];

  if (tierFirst.length > 4) {
    chosen = [...tierFirst].sort(sortProximityToPositive3).slice(0, 4);
  } else {
    chosen = [...tierFirst].sort(sortFillOrder);
    if (chosen.length < 4) {
      const picked = new Set(chosen.map((c) => c.number));
      const tierSecond = scored
        .filter((s) => !picked.has(s.number) && inDeltaPpRange(s.deltaPp, 0.0, 0.9))
        .sort(sortFillOrder);
      for (const s of tierSecond) {
        if (chosen.length >= 4) break;
        chosen.push(s);
        picked.add(s.number);
      }
    }
  }

  if (chosen.length !== 4) {
    return null;
  }

  const sorted = [...chosen].sort((a, b) => a.number - b.number).map((s) => s.number);
  return [sorted[0], sorted[1], sorted[2], sorted[3]];
}
