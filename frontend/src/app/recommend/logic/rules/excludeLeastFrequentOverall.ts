import { RecommendRule } from '@/app/recommend/logic/types'

export const excludeLeastFrequentOverallRule: RecommendRule = {
  id: 'exclude-least-frequent-overall',
  name: '누적 최저 출현 번호 제외',
  apply: ({ exclusionCandidates }) => {
    const least = exclusionCandidates.leastFrequentOverall
    return {
      ruleId: 'exclude-least-frequent-overall',
      ruleName: '누적 최저 출현 번호 제외',
      excludedNumbers: [least.number],
      reason: `전체 누적 기준 출현 횟수 ${least.count}회인 번호 ${least.number}번을 제외합니다.`,
    }
  },
}
