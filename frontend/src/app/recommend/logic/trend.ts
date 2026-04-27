import { TrendNumberResult } from '@/app/recommend/logic/types'
import { isWinningRow } from '@/app/recommend/logic/validators'

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

export function buildTrendResults(allRows: WinningRow[]): TrendNumberResult[] {
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

export function toWinningRows(data: unknown): WinningRow[] {
  return Array.isArray(data) ? data.filter(isWinningRow) : []
}
