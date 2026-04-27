'use client'

import { useMemo, useState } from 'react'
import { generate20Sets } from '@/app/recommend/logic/generator'
import { generateAndSaveSets, fetchRecommendBaseData, errorMessage } from '@/app/recommend/logic/api'
import { runRecommendPipeline } from '@/app/recommend/logic/pipeline'
import { excludeTopRankFromWindowsRule } from '@/app/recommend/logic/rules/excludeTopRankFromWindows'
import { excludeChiSquareHighDeviationRule } from '@/app/recommend/logic/rules/excludeChiSquareHighDeviation'
import { excludeTrendDownRule } from '@/app/recommend/logic/rules/excludeTrendDown'
import { excludeAbsenceStreakTop5Rule } from '@/app/recommend/logic/rules/excludeAbsenceStreakTop5'
import { GeneratedSet, RecommendPipelineResult } from '@/app/recommend/logic/types'

const RULES = [
  excludeTopRankFromWindowsRule,
  excludeChiSquareHighDeviationRule,
  excludeTrendDownRule,
  excludeAbsenceStreakTop5Rule,
]

interface UseRecommendGenerationOptions {
  selectedDraw: number | null
  setPipelineResult: (value: RecommendPipelineResult | null) => void
  setGeneratedSets: (value: GeneratedSet[]) => void
  setStatusMessage: (value: string | null) => void
  setError: (value: string | null) => void
}

export function useRecommendGeneration({
  selectedDraw,
  setPipelineResult,
  setGeneratedSets,
  setStatusMessage,
  setError,
}: UseRecommendGenerationOptions) {
  const [isGenerating, setIsGenerating] = useState(false)
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || '', [])

  const handleGenerateAndSave = async () => {
    if (!selectedDraw) return
    setIsGenerating(true)
    setError(null)
    setStatusMessage('분석 기반 제외 후보를 조회하는 중입니다...')

    try {
      const baseData = await fetchRecommendBaseData(apiUrl, selectedDraw)
      const nextPipelineResult = runRecommendPipeline(baseData, RULES)
      setPipelineResult(nextPipelineResult)
      setStatusMessage('추천 번호를 생성하고 저장하는 중입니다...')

      const excludedSet = new Set(nextPipelineResult.excludedNumbers)
      const availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1).filter((n) => !excludedSet.has(n))
      const generatedSetsPayload = generate20Sets(availableNumbers, baseData.trendResults).map((set) => ({
        ...set,
        applied_rule_ids: nextPipelineResult.appliedRules.map((rule) => rule.ruleId),
        excluded_numbers: nextPipelineResult.excludedNumbers,
      }))

      const generatedData = await generateAndSaveSets(apiUrl, {
        drawNo: baseData.exclusionCandidates.drawNo,
        appliedRuleIds: nextPipelineResult.appliedRules.map((rule) => rule.ruleId),
        excludedNumbers: nextPipelineResult.excludedNumbers,
        sets: generatedSetsPayload,
      })

      setGeneratedSets(generatedData)
      setStatusMessage(
        `${baseData.exclusionCandidates.drawNo}회차 기준으로 ${generatedData.length}개 추천 세트를 생성 및 저장했습니다.`,
      )
    } catch (err: unknown) {
      const msg = errorMessage(err)
      setError(msg)
      setPipelineResult(null)
      setGeneratedSets([])
      setStatusMessage(null)
    } finally {
      setIsGenerating(false)
    }
  }

  return { isGenerating, handleGenerateAndSave }
}
