import { isWinningNumberRow } from '@/app/analysis/chi-square/logic/guards'
import type { WinningNumberRow } from '@/app/analysis/chi-square/types'
import { GeneratedSet } from '@/app/recommend/logic/types'
import { isGeneratedSet, isWinningRow } from '@/app/recommend/logic/validators'

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

export interface SavedRecommendData {
  sets: GeneratedSet[]
  winningNumbers: number[] | null
}

export async function fetchSavedRecommendData(apiUrl: string, drawNo: number): Promise<SavedRecommendData> {
  const [drawingsResponse, winningNumberResponse] = await Promise.all([
    fetch(`${apiUrl}/api/recommend/drawings?draw_no=${drawNo}`),
    fetch(`${apiUrl}/api/analysis/accu-nums/winning-number?draw_no=${drawNo}`),
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
