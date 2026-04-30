import { mkPairKey } from '@/app/recommend/logic/generator/coverage'
import { WinningHistoryRow } from '@/app/recommend/logic/types'

/** 최근 회차 윈도우 기본값(약 1년) */
export const DEFAULT_HISTORY_WINDOW = 52

/**
 * 최근 당첨 이력에서 주번 6개만 집계한 빈도 신호.
 * 동일 입력·동일 draw_no 정렬 순서면 항상 동일 결과(결정론).
 */
export interface HistorySignals {
  readonly numberHitCount: ReadonlyMap<number, number>
  readonly pairHitCount: ReadonlyMap<string, number>
  readonly maxNumberHits: number
  readonly maxPairHits: number
}

/**
 * @param rows 전체 또는 일부 당첨 이력
 * @param recentWindow 최근 몇 회만 사용할지(회차 오름차순 기준 끝에서부터)
 */
export function buildHistorySignals(
  rows: WinningHistoryRow[],
  recentWindow: number = DEFAULT_HISTORY_WINDOW,
): HistorySignals {
  if (rows.length === 0) {
    return {
      numberHitCount: new Map(),
      pairHitCount: new Map(),
      maxNumberHits: 0,
      maxPairHits: 0,
    }
  }

  const sorted = [...rows].sort((a, b) => {
    if (a.draw_no !== b.draw_no) return a.draw_no - b.draw_no
    return 0
  })
  const slice =
    sorted.length <= recentWindow ? sorted : sorted.slice(-recentWindow)

  const numberHits = new Map<number, number>()
  const pairHits = new Map<string, number>()

  for (const row of slice) {
    const mains = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6]
    for (const n of mains) {
      numberHits.set(n, (numberHits.get(n) ?? 0) + 1)
    }
    for (let i = 0; i < mains.length; i++) {
      for (let j = i + 1; j < mains.length; j++) {
        const key = mkPairKey(mains[i], mains[j])
        pairHits.set(key, (pairHits.get(key) ?? 0) + 1)
      }
    }
  }

  let maxNumberHits = 0
  for (const v of numberHits.values()) {
    if (v > maxNumberHits) maxNumberHits = v
  }
  let maxPairHits = 0
  for (const v of pairHits.values()) {
    if (v > maxPairHits) maxPairHits = v
  }

  return {
    numberHitCount: numberHits,
    pairHitCount: pairHits,
    maxNumberHits,
    maxPairHits,
  }
}
