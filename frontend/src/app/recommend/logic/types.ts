export type WindowKey = 'overall' | 'sixMonth' | 'oneYear' | 'threeYear' | 'fiveYear' | 'tenYear'

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

export interface RecommendRuleContext {
  exclusionCandidates: ExclusionCandidatesResponse
  currentExcludedNumbers: number[]
  chiSquareRows?: ChiSquareHistoryRow[]
}

export interface RecommendRuleResult {
  ruleId: string
  ruleName: string
  excludedNumbers: number[]
  reason: string
}

export interface RecommendRule {
  id: string
  name: string
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
  applied_rule_ids?: string[]
  excluded_numbers?: number[]
}
