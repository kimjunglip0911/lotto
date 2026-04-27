import { buildTrendResults, toWinningRows } from '@/app/recommend/logic/trend'
import { ChiSquareHistoryRow, ExclusionCandidatesResponse, GeneratedSet, TrendNumberResult } from '@/app/recommend/logic/types'
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
  const data = await fetchJson(`${apiUrl}/api/analysis/accumulated-numbers/draw-numbers`)
  if (!Array.isArray(data)) {
    throw new Error('Draw numbers response is not an array')
  }
  return data.filter((item): item is number => typeof item === 'number')
}

export interface RecommendBaseData {
  exclusionCandidates: ExclusionCandidatesResponse
  chiSquareRows: ChiSquareHistoryRow[]
  absenceStreakRows: ChiSquareHistoryRow[]
  trendResults: TrendNumberResult[]
}

export async function fetchRecommendBaseData(apiUrl: string, drawNo: number): Promise<RecommendBaseData> {
  const [exclusionResponse, chiSquareRangeResponse, absenceStreakRangeResponse, allHistoryResponse] =
    await Promise.all([
      fetch(`${apiUrl}/api/recommend/exclusion-candidates?draw_no=${drawNo}`),
      fetch(`${apiUrl}/api/analysis/chi-square/winning-numbers-range?draw_no=${drawNo}`),
      fetch(`${apiUrl}/api/analysis/absence-streak/winning-numbers-range?draw_no=${drawNo}`),
      fetch(`${apiUrl}/api/analysis/trend/all-history?draw_no=${drawNo}`),
    ])

  if (!exclusionResponse.ok) {
    throw new Error(`Failed to fetch exclusion candidates: ${exclusionResponse.status}`)
  }

  const [exclusionData, chiSquareRangeData, absenceStreakRangeData, allHistoryData]: [
    unknown,
    unknown,
    unknown,
    unknown,
  ] = await Promise.all([
    exclusionResponse.json(),
    chiSquareRangeResponse.ok ? chiSquareRangeResponse.json() : Promise.resolve([]),
    absenceStreakRangeResponse.ok ? absenceStreakRangeResponse.json() : Promise.resolve([]),
    allHistoryResponse.ok ? allHistoryResponse.json() : Promise.resolve([]),
  ])

  if (!isExclusionCandidatesResponse(exclusionData)) {
    throw new Error('Exclusion candidates response is invalid')
  }

  const chiSquareRows = Array.isArray(chiSquareRangeData) ? chiSquareRangeData.filter(isChiSquareHistoryRow) : []
  const absenceStreakRows = Array.isArray(absenceStreakRangeData)
    ? absenceStreakRangeData.filter(isChiSquareHistoryRow)
    : []
  const allHistoryRows = toWinningRows(allHistoryData)

  return {
    exclusionCandidates: exclusionData,
    chiSquareRows,
    absenceStreakRows,
    trendResults: buildTrendResults(allHistoryRows),
  }
}

export interface SavedRecommendData extends RecommendBaseData {
  sets: GeneratedSet[]
  winningNumbers: number[] | null
}

export async function fetchSavedRecommendData(apiUrl: string, drawNo: number): Promise<SavedRecommendData> {
  const [drawingsResponse, winningNumberResponse, baseData] = await Promise.all([
    fetch(`${apiUrl}/api/recommend/drawings?draw_no=${drawNo}`),
    fetch(`${apiUrl}/api/analysis/accumulated-numbers/winning-number?draw_no=${drawNo}`),
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
