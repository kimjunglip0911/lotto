import { RecommendPipelineResult, RecommendRule, RecommendRuleContext } from '@/app/recommend/logic/types'

export function runRecommendPipeline(baseContext: Omit<RecommendRuleContext, 'currentExcludedNumbers'>, rules: RecommendRule[]): RecommendPipelineResult {
  const appliedRules: RecommendPipelineResult['appliedRules'] = []
  const excludedNumberSet = new Set<number>()
  /** isIrreversible 규칙이 제외한 번호 — restoredNumbers로도 삭제 불가 */
  const irreversibleSet = new Set<number>()

  for (const rule of rules) {
    const result = rule.apply({
      ...baseContext,
      currentExcludedNumbers: Array.from(excludedNumberSet).sort((a, b) => a - b),
      appliedRuleResults: [...appliedRules],
    })
    appliedRules.push(result)
    for (const number of result.excludedNumbers) {
      excludedNumberSet.add(number)
    }
    if (rule.isIrreversible) {
      for (const number of result.excludedNumbers) {
        irreversibleSet.add(number)
      }
    }
    for (const number of result.restoredNumbers ?? []) {
      if (!irreversibleSet.has(number)) {
        excludedNumberSet.delete(number)
      }
    }
  }

  return {
    appliedRules,
    excludedNumbers: Array.from(excludedNumberSet).sort((a, b) => a - b),
  }
}
