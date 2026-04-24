import { ChiSquareHistoryRow, RecommendRule } from '@/app/recommend/logic/types'

const TOTAL_NUMBERS = 45
const NUMBERS_PER_DRAW = 7

/** chi-square 페이지와 동일한 수식으로 번호별 편차를 계산한다 */
function computeDeviations(rows: ChiSquareHistoryRow[]): { number: number; deviation: number }[] {
  const n = rows.length
  const expected = (n * NUMBERS_PER_DRAW) / TOTAL_NUMBERS
  const counts = Array.from({ length: TOTAL_NUMBERS }, () => 0)

  for (const row of rows) {
    const nums = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6, row.bonus_num]
    for (const num of nums) {
      if (num >= 1 && num <= TOTAL_NUMBERS) {
        counts[num - 1] += 1
      }
    }
  }

  return counts.map((observed, index) => ({
    number: index + 1,
    deviation: observed - expected,
  }))
}

export const excludeChiSquareHighDeviationRule: RecommendRule = {
  id: 'exclude-chi-square-high-deviation',
  name: '카이제곱 +편차 상위 5% 번호 제외',
  isIrreversible: true,
  apply: ({ chiSquareRows }) => {
    const rows = chiSquareRows ?? []

    // 이전 회차 데이터가 없으면 제외 번호 없음
    if (rows.length === 0) {
      return {
        ruleId: 'exclude-chi-square-high-deviation',
        ruleName: '카이제곱 +편차 상위 5% 번호 제외',
        excludedNumbers: [],
        reason: '분석할 이전 회차 데이터가 없어 카이제곱 제외를 적용하지 않습니다.',
      }
    }

    const deviations = computeDeviations(rows)
    const positiveDeviations = deviations.filter((d) => d.deviation > 0).map((d) => d.deviation)

    // 양수 편차 항목이 없으면 제외 번호 없음 (과다 제외 방지)
    if (positiveDeviations.length === 0) {
      return {
        ruleId: 'exclude-chi-square-high-deviation',
        ruleName: '카이제곱 +편차 상위 5% 번호 제외',
        excludedNumbers: [],
        reason: '+편차 번호가 없어 카이제곱 제외를 적용하지 않습니다.',
      }
    }

    const sorted = [...positiveDeviations].sort((a, b) => a - b)
    const idx = Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1)
    const top5PctThreshold = sorted[idx]

    const excludedNumbers = deviations
      .filter((d) => d.deviation >= top5PctThreshold)
      .map((d) => d.number)
      .sort((a, b) => a - b)

    return {
      ruleId: 'exclude-chi-square-high-deviation',
      ruleName: '카이제곱 +편차 상위 5% 번호 제외',
      excludedNumbers,
      reason: `+편차 상위 5% 임계값(${top5PctThreshold.toFixed(2)}) 이상인 번호 ${excludedNumbers.length}개를 제외합니다.`,
    }
  },
}
