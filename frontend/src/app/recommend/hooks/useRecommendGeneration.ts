'use client'

import { useState } from 'react'
import {
  generateCombinationBasedSets,
  TARGET_SET_COUNT,
} from '@/app/recommend/logic/combinationBasedSets'
import {
  errorMessage,
  fetchChiSquareFullHistory,
  generateAndSaveSets,
} from '@/app/recommend/logic/api'
import { fetchFinalPickAdopted } from '@/app/recommend/logic/finalPickAdopted'
import { GeneratedSet } from '@/app/recommend/logic/types'
import { useRecommendApiUrl } from '@/app/recommend/hooks/useRecommendApiUrl'

const APPLIED_RULE_IDS = ['final-pick-adopted', 'combination-30sets'] as const

interface UseRecommendGenerationOptions {
  selectedDraw: number | null
  setGeneratedSets: (value: GeneratedSet[]) => void
  setAdoptedNumbers: (value: number[]) => void
  setCombinationSummaryLines: (value: string[]) => void
  setStatusMessage: (value: string | null) => void
  setError: (value: string | null) => void
}

export function useRecommendGeneration({
  selectedDraw,
  setGeneratedSets,
  setAdoptedNumbers,
  setCombinationSummaryLines,
  setStatusMessage,
  setError,
}: UseRecommendGenerationOptions) {
  const [isGenerating, setIsGenerating] = useState(false)
  const apiUrl = useRecommendApiUrl()

  const handleGenerateAndSave = async () => {
    if (!selectedDraw) return
    setIsGenerating(true)
    setError(null)
    setStatusMessage('통합 채택 번호와 조합 통계를 불러오는 중입니다...')

    try {
      const [adoptedResult, fullHistory] = await Promise.all([
        fetchFinalPickAdopted(apiUrl, selectedDraw),
        fetchChiSquareFullHistory(apiUrl),
      ])

      if (adoptedResult.error) {
        throw new Error(adoptedResult.error)
      }

      const adopted = adoptedResult.adopted
      setAdoptedNumbers(adopted)

      if (adopted.length < 6) {
        throw new Error('통합 채택 번호가 6개 미만입니다. 당첨번호가 등록된 회차인지 확인해 주세요.')
      }

      setStatusMessage(`조합 제약을 적용해 ${TARGET_SET_COUNT}세트를 생성하는 중입니다...`)

      const { sets, summaryLines, warning } = await generateCombinationBasedSets(fullHistory, adopted)
      setCombinationSummaryLines([
        ...(adoptedResult.infoMessage ? [adoptedResult.infoMessage] : []),
        ...summaryLines,
      ])

      if (sets.length === 0) {
        throw new Error(summaryLines.join(' ') || '세트를 생성하지 못했습니다.')
      }

      const excludedNumbers = Array.from({ length: 45 }, (_, i) => i + 1).filter((n) => !adopted.includes(n))

      const payloadSets = sets.map((set) => ({
        ...set,
        applied_rule_ids: [...APPLIED_RULE_IDS],
        excluded_numbers: excludedNumbers,
      }))

      setStatusMessage('서버에 저장하는 중입니다...')

      const generatedData = await generateAndSaveSets(apiUrl, {
        drawNo: selectedDraw,
        appliedRuleIds: [...APPLIED_RULE_IDS],
        excludedNumbers,
        sets: payloadSets,
      })

      setGeneratedSets(generatedData)
      const refNote = adoptedResult.infoMessage ? ` ${adoptedResult.infoMessage}` : ''
      const tail = warning ? ` (${warning})` : ''
      setStatusMessage(
        `${selectedDraw}회차 기준으로 ${generatedData.length}개 세트를 생성·저장했습니다.${refNote}${tail}`,
      )
    } catch (err: unknown) {
      const msg = errorMessage(err)
      setError(msg)
      setGeneratedSets([])
      setAdoptedNumbers([])
      setCombinationSummaryLines([])
      setStatusMessage(null)
    } finally {
      setIsGenerating(false)
    }
  }

  return { isGenerating, handleGenerateAndSave }
}
