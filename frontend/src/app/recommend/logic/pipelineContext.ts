import type { RecommendBaseData } from '@/app/recommend/logic/api'
import type { RecommendRuleContext } from '@/app/recommend/logic/types'

/**
 * UI·검증 스크립트가 `runRecommendPipeline`에 동일한 필드만 넘기도록 한 경로로 묶는다.
 * 규칙 컨텍스트에 필드가 추가되면 이 함수만 수정하면 된다.
 */
export function toRecommendPipelineBaseContext(
  data: RecommendBaseData,
): Omit<RecommendRuleContext, 'currentExcludedNumbers'> {
  return {
    exclusionCandidates: data.exclusionCandidates,
    chiSquareRows: data.chiSquareRows,
    trendResults: data.trendResults,
    absenceStreakRows: data.absenceStreakRows,
  }
}
