/** 로또 6/45 등수: 1~5등, 낙첨은 null */
export type Lotto645Rank = 1 | 2 | 3 | 4 | 5 | null

/**
 * 6/45 당첨 등수 계산.
 * - 1등: 주번호 6개 일치
 * - 2등: 주번호 5개 + 보너스 일치
 * - 3등: 주번호 5개 일치(보너스 미포함)
 * - 4등: 주번호 4개 일치
 * - 5등: 주번호 3개 일치
 */
export function rankLotto645(pick: number[], winningMain: number[], bonus: number): Lotto645Rank {
  const mainSet = new Set(winningMain)
  let matchedMain = 0
  for (const n of pick) {
    if (mainSet.has(n)) matchedMain += 1
  }
  const hasBonus = pick.includes(bonus)
  if (matchedMain === 6) return 1
  if (matchedMain === 5 && hasBonus) return 2
  if (matchedMain === 5) return 3
  if (matchedMain === 4) return 4
  if (matchedMain === 3) return 5
  return null
}

const RANK_ORDER: Array<Exclude<Lotto645Rank, null>> = [1, 2, 3, 4, 5]

/** 여러 세트 중 가장 높은 등수(숫자가 작을수록 상위) */
export function bestRank(ranks: Lotto645Rank[]): Lotto645Rank {
  let best: Lotto645Rank = null
  for (const r of ranks) {
    if (r === null) continue
    if (best === null || RANK_ORDER.indexOf(r) < RANK_ORDER.indexOf(best)) best = r
  }
  return best
}

export function rankLabel(r: Lotto645Rank): string {
  if (r === null) return '-'
  return `${r}등`
}
