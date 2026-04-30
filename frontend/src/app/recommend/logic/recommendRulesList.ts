import { excludeChiSquareHighDeviationRule } from '@/app/recommend/logic/rules/excludeChiSquareHighDeviation'
import { excludeTrendDownRule } from '@/app/recommend/logic/rules/excludeTrendDown'
import { excludeAbsenceStreakTop5Rule } from '@/app/recommend/logic/rules/excludeAbsenceStreakTop5'
import type { RecommendRule } from '@/app/recommend/logic/types'

/** 추천 파이프라인 규칙 순서(클라이언트·검증 스크립트 공통 정본) */
export const RECOMMEND_RULES: RecommendRule[] = [
  excludeChiSquareHighDeviationRule,
  excludeTrendDownRule,
  excludeAbsenceStreakTop5Rule,
]
