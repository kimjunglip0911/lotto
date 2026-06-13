/** 레거시 규칙 파이프라인 타입(저장·호환용) */

export type WindowKey = 'overall' | 'sixMonth' | 'oneYear' | 'threeYear' | 'fiveYear' | 'tenYear';

export type TrendDirection = 'up_cont' | 'topping' | 'recovering' | 'down_cont';

export interface TrendNumberResult {
  number: number;
  trend: TrendDirection;
}

export interface RankedNumberInfo {
  number: number;
  count: number;
  is_tie: boolean;
  candidates: number[];
}

export interface ExclusionCandidatesResponse {
  drawNo: number;
  leastFrequentOverall: RankedNumberInfo;
  windowTopNumbers: Record<WindowKey, RankedNumberInfo>;
  excludedNumbersUnion: number[];
  drawCounts: Record<WindowKey, number>;
  ruleMeta: {
    topTiePolicy: string;
    leastTiePolicy: string;
    countedFields: string[];
  };
}

export interface WinningHistoryRow {
  draw_no: number;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus_num: number;
}

export interface RecommendRuleContext {
  exclusionCandidates: ExclusionCandidatesResponse;
  currentExcludedNumbers: number[];
  trendResults?: TrendNumberResult[];
  appliedRuleResults?: RecommendRuleResult[];
}

export interface RecommendRuleResult {
  ruleId: string;
  ruleName: string;
  excludedNumbers: number[];
  restoredNumbers?: number[];
  reason: string;
}

export interface RecommendRule {
  id: string;
  name: string;
  isIrreversible?: boolean;
  apply: (context: RecommendRuleContext) => RecommendRuleResult;
}

export interface RecommendPipelineResult {
  appliedRules: RecommendRuleResult[];
  excludedNumbers: number[];
}
