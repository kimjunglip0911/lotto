import { excludeTopRankFromWindowsRule } from '@/app/recommend/logic/rules/excludeTopRankFromWindows'
import { excludeChiSquareHighDeviationRule } from '@/app/recommend/logic/rules/excludeChiSquareHighDeviation'
import { excludeTrendDownRule } from '@/app/recommend/logic/rules/excludeTrendDown'
import { excludeAbsenceStreakTop5Rule } from '@/app/recommend/logic/rules/excludeAbsenceStreakTop5'

export const RECOMMEND_RULES = [
  excludeTopRankFromWindowsRule,
  excludeChiSquareHighDeviationRule,
  excludeTrendDownRule,
  excludeAbsenceStreakTop5Rule,
]
