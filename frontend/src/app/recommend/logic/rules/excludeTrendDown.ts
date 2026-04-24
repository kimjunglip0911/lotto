import { RecommendRule } from '@/app/recommend/logic/types'

const CHI_SQUARE_RULE_ID = 'exclude-chi-square-high-deviation'

export const excludeTrendDownRule: RecommendRule = {
  id: 'exclude-trend-down',
  name: '추세 감소 번호 제외 / 증가·보류 번호 복원',
  apply: ({ trendResults, appliedRuleResults }) => {
    if (!trendResults || trendResults.length === 0) {
      return {
        ruleId: 'exclude-trend-down',
        ruleName: '추세 감소 번호 제외 / 증가·보류 번호 복원',
        excludedNumbers: [],
        restoredNumbers: [],
        reason: '추세 분석 데이터가 없어 추세 기반 제외를 적용하지 않습니다.',
      }
    }

    const trendMap = new Map(trendResults.map((r) => [r.number, r.trend]))

    const excludedNumbers = trendResults
      .filter((r) => r.trend === 'down')
      .map((r) => r.number)
      .sort((a, b) => a - b)

    /** 카이제곱 규칙이 제외한 번호 중 증가·보류 추세인 번호를 복원 대상으로 삼는다.
     *  누적 규칙(isIrreversible)의 번호는 파이프라인이 실제 복원을 차단한다. */
    const chiSquareExcluded = (appliedRuleResults ?? [])
      .filter((r) => r.ruleId === CHI_SQUARE_RULE_ID)
      .flatMap((r) => r.excludedNumbers)

    const restoredNumbers = [...new Set(chiSquareExcluded)]
      .filter((num) => {
        const trend = trendMap.get(num)
        return trend === 'up' || trend === 'hold'
      })
      .sort((a, b) => a - b)

    const downCount = excludedNumbers.length
    const restoredCount = restoredNumbers.length

    const parts: string[] = []
    if (downCount > 0) {
      parts.push(`감소 추세 번호 ${downCount}개(${excludedNumbers.join(', ')})를 제외합니다`)
    }
    if (restoredCount > 0) {
      parts.push(`증가·보류 추세 번호 ${restoredCount}개(${restoredNumbers.join(', ')})를 제외 목록에서 복원합니다`)
    }
    const reason =
      parts.length > 0
        ? parts.join('. ') + '.'
        : '추세 기반으로 변경되는 번호가 없습니다.'

    return {
      ruleId: 'exclude-trend-down',
      ruleName: '추세 감소 번호 제외 / 증가·보류 번호 복원',
      excludedNumbers,
      restoredNumbers,
      reason,
    }
  },
}
