import { RecommendRule } from '@/app/recommend/logic/types'
import { normalizeNumberList } from '@/app/recommend/logic/rules/common'

const RULE_ID = 'exclude-top-rank-from-windows'
const RULE_NAME = '기간별 1등 번호 집합 제외'

const WINDOW_LABELS: Record<string, string> = {
  overall: '전체',
  sixMonth: '6개월',
  oneYear: '1년',
  threeYear: '3년',
  fiveYear: '5년',
  tenYear: '10년',
}

export const excludeTopRankFromWindowsRule: RecommendRule = {
  id: RULE_ID,
  name: RULE_NAME,
  isIrreversible: true,
  apply: ({ exclusionCandidates }) => {
    const ranked = exclusionCandidates.windowTopNumbers
    const windowOrder: (keyof typeof ranked)[] = ['overall', 'sixMonth', 'oneYear', 'threeYear', 'fiveYear', 'tenYear']
    const excludedNumbers = normalizeNumberList(
      windowOrder
        .flatMap((key) => ranked[key]?.candidates ?? [])
        .filter((value): value is number => typeof value === 'number'),
    )
    const detail = windowOrder
      .map((key) => `${WINDOW_LABELS[key]} [${(ranked[key]?.candidates ?? []).join(', ')}]번`)
      .join(', ')

    return {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      excludedNumbers,
      reason: `${detail}을 집합으로 합쳐 제외합니다.`,
    }
  },
}
