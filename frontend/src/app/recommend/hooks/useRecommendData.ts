'use client'

import { useEffect, useState } from 'react'
import { RecommendPipelineResult } from '@/app/recommend/logic/types'
import { fetchDrawNumbers, fetchSavedRecommendData } from '@/app/recommend/logic/api'
import { runRecommendPipeline } from '@/app/recommend/logic/pipeline'
import { GeneratedSet } from '@/app/recommend/logic/types'
import { RECOMMEND_RULES } from '@/app/recommend/hooks/recommendRules'
import { useRecommendApiUrl } from '@/app/recommend/hooks/useRecommendApiUrl'

export function useRecommendData() {
  const [availableDraws, setAvailableDraws] = useState<number[]>([])
  const [selectedDraw, setSelectedDraw] = useState<number | null>(null)
  const [isLoadingDraws, setIsLoadingDraws] = useState(true)
  const [drawLoadError, setDrawLoadError] = useState<string | null>(null)

  const [statusMessage, setStatusMessage] = useState<string | null>(
    '생성 및 저장 실행 버튼을 누르면 추천 로직을 적용합니다.',
  )
  const [error, setError] = useState<string | null>(null)
  const [pipelineResult, setPipelineResult] = useState<RecommendPipelineResult | null>(null)
  const [generatedSets, setGeneratedSets] = useState<GeneratedSet[]>([])
  const [winningNumbers, setWinningNumbers] = useState<number[] | null>(null)

  const apiUrl = useRecommendApiUrl()

  const resetSavedDataState = (draw: number) => {
    setPipelineResult(null)
    setGeneratedSets([])
    setWinningNumbers(null)
    setError(null)
    setStatusMessage(`${draw}회차 저장된 추천 세트를 불러오는 중입니다...`)
  }

  const applySavedDataState = (
    draw: number,
    winningNumbersData: number[] | null,
    sets: GeneratedSet[],
    pipeline: RecommendPipelineResult,
  ) => {
    setWinningNumbers(winningNumbersData)
    setGeneratedSets(sets)
    setPipelineResult(pipeline)
    if (sets.length > 0) {
      setStatusMessage(`${draw}회차 기준 저장된 ${sets.length}개 추천 세트를 불러왔습니다.`)
      return
    }
    setStatusMessage(`${draw}회차 기준 저장된 추천 세트가 없습니다. 생성 및 저장 실행 버튼을 눌러 생성하세요.`)
  }

  const applySavedDataErrorState = (draw: number) => {
    setGeneratedSets([])
    setPipelineResult(null)
    setStatusMessage(`${draw}회차 세트 조회 중 오류가 발생했습니다.`)
  }

  useEffect(() => {
    let isMounted = true
    const loadDrawNumbers = async () => {
      setIsLoadingDraws(true)
      setDrawLoadError(null)
      try {
        const draws = await fetchDrawNumbers(apiUrl)
        if (!isMounted) return
        const nextDraw = draws.length > 0 ? draws[0] + 1 : 1
        setAvailableDraws([nextDraw, ...draws])
        setSelectedDraw(nextDraw)
      } catch (err) {
        if (!isMounted) return
        console.error('Error fetching draw numbers:', err)
        setAvailableDraws([])
        setDrawLoadError('회차 정보를 불러오지 못했습니다.')
      } finally {
        if (isMounted) {
          setIsLoadingDraws(false)
        }
      }
    }

    void loadDrawNumbers()
    return () => {
      isMounted = false
    }
  }, [apiUrl])

  useEffect(() => {
    if (!selectedDraw || isLoadingDraws) return
    let isMounted = true

    const loadSavedSets = async () => {
      resetSavedDataState(selectedDraw)

      try {
        const saved = await fetchSavedRecommendData(apiUrl, selectedDraw)
        const pipeline = runRecommendPipeline(
          {
            exclusionCandidates: saved.exclusionCandidates,
            chiSquareRows: saved.chiSquareRows,
            trendResults: saved.trendResults,
            absenceStreakRows: saved.absenceStreakRows,
          },
          RECOMMEND_RULES,
        )
        if (!isMounted) return

        applySavedDataState(selectedDraw, saved.winningNumbers, saved.sets, pipeline)
      } catch (err) {
        if (!isMounted) return
        applySavedDataErrorState(selectedDraw)
        console.error('Error fetching saved drawings:', err)
      }
    }

    void loadSavedSets()
    return () => {
      isMounted = false
    }
  }, [apiUrl, isLoadingDraws, selectedDraw])

  return {
    availableDraws,
    selectedDraw,
    setSelectedDraw,
    isLoadingDraws,
    drawLoadError,
    statusMessage,
    setStatusMessage,
    error,
    setError,
    pipelineResult,
    setPipelineResult,
    generatedSets,
    setGeneratedSets,
    winningNumbers,
  }
}
