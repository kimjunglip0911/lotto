import { ChiSquareHistoryRow, GeneratedSet } from '@/app/recommend/logic/types'

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
