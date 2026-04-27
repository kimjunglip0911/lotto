import {
  ChiSquareHistoryRow,
  ExclusionCandidatesResponse,
  GeneratedSet,
  TrendNumberResult,
} from '@/app/recommend/logic/types'

const TOTAL_NUMBERS = 45
const K_CONFIG = { fast: 0.05, slow: 0.02 } as const
const TREND_BASELINE = 6 / 45

type WinningRow = {
  draw_no: number
  num1: number
  num2: number
  num3: number
  num4: number
  num5: number
  num6: number
  bonus_num: number
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function isRankedNumberInfo(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const info = value as { number?: unknown; count?: unknown; is_tie?: unknown; candidates?: unknown }
  return (
    typeof info.number === 'number' &&
    typeof info.count === 'number' &&
    typeof info.is_tie === 'boolean' &&
    Array.isArray(info.candidates)
  )
}

function isExclusionCandidatesResponse(value: unknown): value is ExclusionCandidatesResponse {
  if (typeof value !== 'object' || value === null) return false
  const data = value as {
    drawNo?: unknown
    leastFrequentOverall?: unknown
    windowTopNumbers?: Record<string, unknown>
    excludedNumbersUnion?: unknown
  }
  const windows = data.windowTopNumbers
  return (
    typeof data.drawNo === 'number' &&
    isRankedNumberInfo(data.leastFrequentOverall) &&
    typeof windows === 'object' &&
    windows !== null &&
    ['overall', 'sixMonth', 'oneYear', 'threeYear', 'fiveYear', 'tenYear'].every((key) =>
      isRankedNumberInfo(windows[key]),
    ) &&
    Array.isArray(data.excludedNumbersUnion)
  )
}

function isWinningRow(value: unknown): value is WinningRow {
  if (typeof value !== 'object' || value === null) return false
  const row = value as Record<string, unknown>
  return (
    typeof row.draw_no === 'number' &&
    typeof row.num1 === 'number' &&
    typeof row.num2 === 'number' &&
    typeof row.num3 === 'number' &&
    typeof row.num4 === 'number' &&
    typeof row.num5 === 'number' &&
    typeof row.num6 === 'number' &&
    typeof row.bonus_num === 'number'
  )
}

function isChiSquareHistoryRow(value: unknown): value is ChiSquareHistoryRow {
  return isWinningRow(value)
}

function isGeneratedSet(value: unknown): value is GeneratedSet {
  if (typeof value !== 'object' || value === null) return false
  const row = value as Record<string, unknown>
  return (
    typeof row.num1 === 'number' &&
    typeof row.num2 === 'number' &&
    typeof row.num3 === 'number' &&
    typeof row.num4 === 'number' &&
    typeof row.num5 === 'number' &&
    typeof row.num6 === 'number' &&
    typeof row.method === 'string'
  )
}

function buildFixedKEma(rows: WinningRow[], num: number, k: number): number {
  if (rows.length === 0) return 0
  let ema = 0
  for (const row of rows) {
    const nums = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6, row.bonus_num]
    const signal = nums.includes(num) ? 1 : 0
    ema = signal * k + ema * (1 - k)
  }
  return ema
}

function buildTrendResults(allRows: WinningRow[]): TrendNumberResult[] {
  return Array.from({ length: TOTAL_NUMBERS }, (_, i) => {
    const num = i + 1
    const emaFast = buildFixedKEma(allRows, num, K_CONFIG.fast)
    const emaSlow = buildFixedKEma(allRows, num, K_CONFIG.slow)
    const shortTermUp = emaFast > emaSlow
    const longTermUp = emaSlow > TREND_BASELINE
    const trend: TrendNumberResult['trend'] = shortTermUp && longTermUp
      ? 'up_cont'
      : !shortTermUp && longTermUp
      ? 'topping'
      : shortTermUp && !longTermUp
      ? 'recovering'
      : 'down_cont'
    return { number: num, trend }
  })
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
  const allHistoryRows = Array.isArray(allHistoryData) ? allHistoryData.filter(isWinningRow) : []

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
