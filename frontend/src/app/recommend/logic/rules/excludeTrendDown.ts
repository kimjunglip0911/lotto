import { RecommendRule } from '@/app/recommend/logic/types'
import { normalizeNumberList } from '@/app/recommend/logic/rules/common'

const RULE_ID = 'exclude-trend-down'
const RULE_NAME = '추세 감소 번호 제외'

export const excludeTrendDownRule: RecommendRule = {
  id: RULE_ID,
  name: RULE_NAME,
  isIrreversible: true,
  apply: ({ trendResults }) => {
    if (!trendResults || trendResults.length === 0) {
      return {
        ruleId: RULE_ID,
        ruleName: RULE_NAME,
        excludedNumbers: [],
        reason: '추세 분석 데이터가 없어 추세 기반 제외를 적용하지 않습니다.',
      }
    }

    // 하락지속(down_cont): Fast/Slow EMA 모두 기댓값 미만 — 완전한 하락 국면
    const excludedNumbers = normalizeNumberList(
      trendResults.filter((r) => r.trend === 'down_cont').map((r) => r.number),
    )

    const reason =
      excludedNumbers.length > 0
        ? `하락지속 번호 ${excludedNumbers.length}개(${excludedNumbers.join(', ')})를 제외합니다.`
        : '하락지속 번호가 없습니다.'

    return {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      excludedNumbers,
      reason,
    }
  },
}
