import { isWinningNumberRow } from '@/app/analysis/chi-square/logic/guards'
import type { WinningNumberRow } from '@/app/analysis/chi-square/types'
import { buildTrendResults, toWinningRows } from '@/app/recommend/logic/trend'
import {
  ChiSquareHistoryRow,
  ExclusionCandidatesResponse,
  GeneratedSet,
  TrendNumberResult,
  UsedNumbersPlan,
  WinningHistoryRow,
} from '@/app/recommend/logic/types'
import { deriveUsedNumbers } from '@/app/recommend/logic/usedNumbers'
import {
  isChiSquareHistoryRow,
  isExclusionCandidatesResponse,
  isGeneratedSet,
  isWinningRow,
} from '@/app/recommend/logic/validators'

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}


async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed request: ${response.status} ${url}`)
  }
  return response.json()
}

export async function fetchDrawNumbers(apiUrl: string): Promise<number[]> {
  const data = await fetchJson(`${apiUrl}/api/analysis/accu-nums/draw-numbers`)
  if (!Array.isArray(data)) {
    throw new Error('Draw numbers response is not an array')
  }
  return data.filter((item): item is number => typeof item === 'number')
}

/** 조합 분석 페이지와 동일: chi-square 회차 목록 + `max+1` 미만 전체 당첨 행 */
export async function fetchChiSquareFullHistory(apiUrl: string): Promise<WinningNumberRow[]> {
  const drawsData = await fetchJson(`${apiUrl}/api/analysis/chi-square/draw-numbers`)
  if (!Array.isArray(drawsData)) {
    throw new Error('Draw numbers response is not an array')
  }
  const draws = drawsData.filter((item): item is number => typeof item === 'number')
  if (draws.length === 0) return []

  const maxDraw = Math.max(...draws)
  const rangeResponse = await fetch(
    `${apiUrl}/api/analysis/chi-square/winning-numbers-range?draw_no=${maxDraw + 1}`,
  )
  if (!rangeResponse.ok) {
    throw new Error(`Failed to fetch winning numbers range: ${rangeResponse.status}`)
  }
  const rangePayload: unknown = await rangeResponse.json()
  if (!Array.isArray(rangePayload)) {
    throw new Error('Winning numbers range response is not an array')
  }
  return rangePayload.filter(isWinningNumberRow)
}

export interface RecommendBaseData {
  exclusionCandidates: ExclusionCandidatesResponse
  usedNumbersPlan: UsedNumbersPlan
  chiSquareRows: ChiSquareHistoryRow[]
  runStreakRows: ChiSquareHistoryRow[]
  trendResults: TrendNumberResult[]
  /** 최근 회차 당첨 이력(생성기 이력 신호용). `trend/all-history` 기반 */
  allHistoryRows: WinningHistoryRow[]
}

export async function fetchRecommendBaseData(apiUrl: string, drawNo: number): Promise<RecommendBaseData> {
  const [exclusionResponse, chiSquareRangeResponse, runStreakRangeResponse, allHistoryResponse] =
    await Promise.all([
      fetch(`${apiUrl}/api/recommend/exclusion-candidates?draw_no=${drawNo}`),
      fetch(`${apiUrl}/api/analysis/chi-square/winning-numbers-range?draw_no=${drawNo}`),
      fetch(`${apiUrl}/api/analysis/run-streak/winning-numbers-range?draw_no=${drawNo}`),
      fetch(`${apiUrl}/api/analysis/trend/all-history?draw_no=${drawNo}`),
    ])

  if (!exclusionResponse.ok) {
    throw new Error(`Failed to fetch exclusion candidates: ${exclusionResponse.status}`)
  }

  const [exclusionData, chiSquareRangeData, runStreakRangeData, allHistoryData]: [
    unknown,
    unknown,
    unknown,
    unknown,
  ] = await Promise.all([
    exclusionResponse.json(),
    chiSquareRangeResponse.ok ? chiSquareRangeResponse.json() : Promise.resolve([]),
    runStreakRangeResponse.ok ? runStreakRangeResponse.json() : Promise.resolve([]),
    allHistoryResponse.ok ? allHistoryResponse.json() : Promise.resolve([]),
  ])

  if (!isExclusionCandidatesResponse(exclusionData)) {
    throw new Error('Exclusion candidates response is invalid')
  }

  const chiSquareRows = Array.isArray(chiSquareRangeData) ? chiSquareRangeData.filter(isChiSquareHistoryRow) : []
  const runStreakRows = Array.isArray(runStreakRangeData)
    ? runStreakRangeData.filter(isChiSquareHistoryRow)
    : []
  const allHistoryRows = toWinningRows(allHistoryData)
  const usedNumbers = deriveUsedNumbers(exclusionData.drawNo, allHistoryRows)

  return {
    exclusionCandidates: exclusionData,
    usedNumbersPlan: {
      drawNo: exclusionData.drawNo,
      numbers: usedNumbers,
    },
    chiSquareRows,
    runStreakRows,
    trendResults: buildTrendResults(allHistoryRows),
    allHistoryRows,
  }
}

export interface SavedRecommendData extends RecommendBaseData {
  sets: GeneratedSet[]
  winningNumbers: number[] | null
}

export async function fetchSavedRecommendData(apiUrl: string, drawNo: number): Promise<SavedRecommendData> {
  const [drawingsResponse, winningNumberResponse, baseData] = await Promise.all([
    fetch(`${apiUrl}/api/recommend/drawings?draw_no=${drawNo}`),
    fetch(`${apiUrl}/api/analysis/accu-nums/winning-number?draw_no=${drawNo}`),
    fetchRecommendBaseData(apiUrl, drawNo),
  ])

  if (!drawingsResponse.ok) {
    throw new Error(`Failed to fetch drawings: ${drawingsResponse.status}`)
  }

  const drawingsData: unknown = await drawingsResponse.json()
  if (!Array.isArray(drawingsData)) {
    throw new Error('Drawings response is not an array')
  }

  const winningNumberData: unknown = winningNumberResponse.ok ? await winningNumberResponse.json() : null
  const winningNumbers = isWinningRow(winningNumberData)
    ? [
        winningNumberData.num1,
        winningNumberData.num2,
        winningNumberData.num3,
        winningNumberData.num4,
        winningNumberData.num5,
        winningNumberData.num6,
      ]
    : null

  return {
    ...baseData,
    sets: drawingsData.filter(isGeneratedSet),
    winningNumbers,
  }
}

export async function generateAndSaveSets(
  apiUrl: string,
  payload: {
    drawNo: number
    appliedRuleIds: string[]
    excludedNumbers: number[]
    sets: Array<GeneratedSet & { applied_rule_ids: string[]; excluded_numbers: number[] }>
  },
): Promise<GeneratedSet[]> {
  const response = await fetch(`${apiUrl}/api/recommend/generate-and-save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      draw_no: payload.drawNo,
      applied_rule_ids: payload.appliedRuleIds,
      excluded_numbers: payload.excludedNumbers,
      sets: payload.sets,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to generate and save sets: ${response.status}`)
  }

  const generatedData: unknown = await response.json()
  if (!Array.isArray(generatedData) || !generatedData.every(isGeneratedSet)) {
    throw new Error('Generate and save response is invalid')
  }
  return generatedData
}

export { errorMessage }
