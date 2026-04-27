import { ChiSquareHistoryRow, ExclusionCandidatesResponse, GeneratedSet } from '@/app/recommend/logic/types'

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

export function isExclusionCandidatesResponse(value: unknown): value is ExclusionCandidatesResponse {
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

export function isWinningRow(value: unknown): value is WinningRow {
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

export function isChiSquareHistoryRow(value: unknown): value is ChiSquareHistoryRow {
  return isWinningRow(value)
}

export function isGeneratedSet(value: unknown): value is GeneratedSet {
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
