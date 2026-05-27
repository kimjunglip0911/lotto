'use client'

import { useEffect, useState } from 'react'
import { fetchDrawNumbers, fetchSavedRecommendData } from '@/app/recommend/logic/api'
import { fetchFinalPickAdopted } from '@/app/recommend/logic/finalPickAdopted'
import type { GeneratedSet } from '@/app/recommend/logic/types'
import { useRecommendApiUrl } from '@/app/recommend/hooks/useRecommendApiUrl'
import {
  orderSetsByProfileSlots,
  TARGET_SET_COUNT,
} from '@/app/recommend/logic/combinationBasedSets'

export function useRecommendData() {
  const [availableDraws, setAvailableDraws] = useState<number[]>([])
  const [selectedDraw, setSelectedDraw] = useState<number | null>(null)
  const [isLoadingDraws, setIsLoadingDraws] = useState(true)
  const [drawLoadError, setDrawLoadError] = useState<string | null>(null)

  const [statusMessage, setStatusMessage] = useState<string | null>(
    `생성 및 저장을 실행하면 통합 채택·조합 분석 기준으로 ${TARGET_SET_COUNT}세트를 만듭니다.`,
  )
  const [error, setError] = useState<string | null>(null)
  const [generatedSets, setGeneratedSets] = useState<GeneratedSet[]>([])
  const [winningNumbers, setWinningNumbers] = useState<number[] | null>(null)
  const [adoptedNumbers, setAdoptedNumbers] = useState<number[]>([])
  const [combinationSummaryLines, setCombinationSummaryLines] = useState<string[]>([])

  const apiUrl = useRecommendApiUrl()

  const resetSavedDataState = (draw: number) => {
    setGeneratedSets([])
    setWinningNumbers(null)
    setAdoptedNumbers([])
    setCombinationSummaryLines([])
    setError(null)
    setStatusMessage(`${draw}회차 저장된 추천 세트를 불러오는 중입니다...`)
  }

  const applySavedDataState = (
    draw: number,
    winningNumbersData: number[] | null,
    sets: GeneratedSet[],
    adopted: number[],
  ) => {
    setWinningNumbers(winningNumbersData)
    setAdoptedNumbers(adopted)
    setGeneratedSets(orderSetsByProfileSlots(sets))
    setCombinationSummaryLines([])
    if (sets.length > 0) {
      setStatusMessage(`${draw}회차 기준 저장된 ${sets.length}개 추천 세트를 불러왔습니다.`)
      return
    }
    setStatusMessage(`${draw}회차 기준 저장된 추천 세트가 없습니다. 생성 및 저장을 실행해 보세요.`)
  }

  const applySavedDataErrorState = (draw: number) => {
    setGeneratedSets([])
    setAdoptedNumbers([])
    setCombinationSummaryLines([])
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
        const adoptedRes = await fetchFinalPickAdopted(apiUrl, selectedDraw)
        if (!isMounted) return

        const adopted = adoptedRes.error ? [] : adoptedRes.adopted
        applySavedDataState(selectedDraw, saved.winningNumbers, saved.sets, adopted)
        if (adoptedRes.infoMessage) {
          setCombinationSummaryLines([adoptedRes.infoMessage])
        }
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
    generatedSets,
    setGeneratedSets,
    winningNumbers,
    adoptedNumbers,
    setAdoptedNumbers,
    combinationSummaryLines,
    setCombinationSummaryLines,
  }
}
