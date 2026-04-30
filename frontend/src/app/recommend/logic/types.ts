export type WindowKey = 'overall' | 'sixMonth' | 'oneYear' | 'threeYear' | 'fiveYear' | 'tenYear'

// 4국면: 상승지속 / 하락전환(정점통과) / 회복중(바닥통과) / 하락지속
export type TrendDirection = 'up_cont' | 'topping' | 'recovering' | 'down_cont'

export interface TrendNumberResult {
  number: number
  trend: TrendDirection
}

export interface RankedNumberInfo {
  number: number
  count: number
  is_tie: boolean
  candidates: number[]
}

export interface ExclusionCandidatesResponse {
  drawNo: number
  leastFrequentOverall: RankedNumberInfo
  windowTopNumbers: Record<WindowKey, RankedNumberInfo>
  excludedNumbersUnion: number[]
  drawCounts: Record<WindowKey, number>
  ruleMeta: {
    topTiePolicy: string
    leastTiePolicy: string
    countedFields: string[]
  }
}

export interface ChiSquareHistoryRow {
  draw_no: number
  num1: number
  num2: number
  num3: number
  num4: number
  num5: number
  num6: number
  bonus_num: number
}

/** 추천 생성기에 전달하는 당첨 이력 한 행(주번 6 + 보너스, all-history 등과 동일 스키마) */
export type WinningHistoryRow = ChiSquareHistoryRow

export interface RecommendRuleContext {
  exclusionCandidates: ExclusionCandidatesResponse
  currentExcludedNumbers: number[]
  chiSquareRows?: ChiSquareHistoryRow[]
  trendResults?: TrendNumberResult[]
  absenceStreakRows?: ChiSquareHistoryRow[]
  appliedRuleResults?: RecommendRuleResult[]
}

export interface RecommendRuleResult {
  ruleId: string
  ruleName: string
  excludedNumbers: number[]
  restoredNumbers?: number[]
  reason: string
}

export interface RecommendRule {
  id: string
  name: string
  /** true이면 이 규칙이 제외한 번호는 이후 규칙의 restoredNumbers에 의해서도 복원되지 않는다 */
  isIrreversible?: boolean
  apply: (context: RecommendRuleContext) => RecommendRuleResult
}

export interface RecommendPipelineResult {
  appliedRules: RecommendRuleResult[]
  excludedNumbers: number[]
}

export interface GeneratedSet {
  num1: number
  num2: number
  num3: number
  num4: number
  num5: number
  num6: number
  method: string
  strategy?: string
  applied_rule_ids?: string[]
  excluded_numbers?: number[]
}
