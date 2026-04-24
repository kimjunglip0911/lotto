import { ChiSquareHistoryRow, RecommendRule } from '@/app/recommend/logic/types'

const TOTAL_NUMBERS = 45

function buildStreaks(rows: ChiSquareHistoryRow[], drawNo: number): { number: number; streak: number }[] {
  const lastSeen: (number | null)[] = Array.from({ length: TOTAL_NUMBERS }, () => null)

  for (const row of rows) {
    const nums = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6, row.bonus_num]
    for (const num of nums) {
      if (num >= 1 && num <= TOTAL_NUMBERS) {
        const prev = lastSeen[num - 1]
        if (prev === null || row.draw_no > prev) {
          lastSeen[num - 1] = row.draw_no
        }
      }
    }
  }

  return lastSeen.map((last, index) => ({
    number: index + 1,
    streak: last === null ? drawNo : drawNo - last,
  }))
}

export const excludeAbsenceStreakTop5Rule: RecommendRule = {
  id: 'exclude-absence-streak-top5',
  name: '연속 미출현 상위 5% 번호 제외',
  isIrreversible: true,
  apply: ({ absenceStreakRows, exclusionCandidates }) => {
    const rows = absenceStreakRows ?? []
    const drawNo = exclusionCandidates.drawNo

    if (rows.length === 0) {
      return {
        ruleId: 'exclude-absence-streak-top5',
        ruleName: '연속 미출현 상위 5% 번호 제외',
        excludedNumbers: [],
        reason: '분석할 이전 회차 데이터가 없어 연속 미출현 제외를 적용하지 않습니다.',
      }
    }

    const streaks = buildStreaks(rows, drawNo)
    const allStreakValues = streaks.map((s) => s.streak)
    const sorted = [...allStreakValues].sort((a, b) => a - b)
    const idx = Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1)
    const top5PctThreshold = sorted[idx]

    const excludedNumbers = streaks
      .filter((s) => s.streak >= top5PctThreshold)
      .map((s) => s.number)
      .sort((a, b) => a - b)

    return {
      ruleId: 'exclude-absence-streak-top5',
      ruleName: '연속 미출현 상위 5% 번호 제외',
      excludedNumbers,
      reason: `연속 미출현 상위 5% 임계값(${top5PctThreshold}회차) 이상인 번호 ${excludedNumbers.length}개를 제외합니다.`,
    }
  },
}
