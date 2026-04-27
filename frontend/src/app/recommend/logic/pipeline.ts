import { RecommendPipelineResult, RecommendRule, RecommendRuleContext } from '@/app/recommend/logic/types'

function applyExcludedNumbers(target: Set<number>, excludedNumbers: number[]): void {
  for (const number of excludedNumbers) {
    target.add(number)
  }
}

function applyIrreversibleNumbers(
  irreversibleSet: Set<number>,
  excludedNumbers: number[],
  isIrreversible: boolean | undefined,
): void {
  if (!isIrreversible) return
  for (const number of excludedNumbers) {
    irreversibleSet.add(number)
  }
}

function applyRestoredNumbers(
  excludedSet: Set<number>,
  irreversibleSet: Set<number>,
  restoredNumbers: number[] | undefined,
): void {
  if (!restoredNumbers) return
  for (const number of restoredNumbers) {
    if (!irreversibleSet.has(number)) {
      excludedSet.delete(number)
    }
  }
}

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
    applyExcludedNumbers(excludedNumberSet, result.excludedNumbers)
    applyIrreversibleNumbers(irreversibleSet, result.excludedNumbers, rule.isIrreversible)
    applyRestoredNumbers(excludedNumberSet, irreversibleSet, result.restoredNumbers)
  }

  return {
    appliedRules,
    excludedNumbers: Array.from(excludedNumberSet).sort((a, b) => a - b),
  }
}
