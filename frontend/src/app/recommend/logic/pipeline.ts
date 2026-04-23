import { RecommendPipelineResult, RecommendRule, RecommendRuleContext } from '@/app/recommend/logic/types'

export function runRecommendPipeline(baseContext: Omit<RecommendRuleContext, 'currentExcludedNumbers'>, rules: RecommendRule[]): RecommendPipelineResult {
  const appliedRules: RecommendPipelineResult['appliedRules'] = []
  const excludedNumberSet = new Set<number>()

  for (const rule of rules) {
    const result = rule.apply({
      ...baseContext,
      currentExcludedNumbers: Array.from(excludedNumberSet).sort((a, b) => a - b),
    })
    appliedRules.push(result)
    for (const number of result.excludedNumbers) {
      excludedNumberSet.add(number)
    }
  }

  return {
    appliedRules,
    excludedNumbers: Array.from(excludedNumberSet).sort((a, b) => a - b),
  }
}
