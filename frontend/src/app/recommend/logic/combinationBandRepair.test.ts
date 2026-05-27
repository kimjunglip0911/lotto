import { describe, expect, it } from 'vitest'
import type { WinningNumberRow } from '@/app/analysis/chi-square/types'
import { numberToBandIndex } from '@/app/analysis/combination/logic/buildPositionBandDistribution'
import {
  buildHistCounts,
  buildPoolByBand,
  randomBandSeed,
  repairOneStep,
  validateSet,
} from '@/app/recommend/logic/combinationBandRepair'

function mkRow(drawNo: number, nums: number[]): WinningNumberRow {
  return {
    draw_no: drawNo,
    num1: nums[0],
    num2: nums[1],
    num3: nums[2],
    num4: nums[3],
    num5: nums[4],
    num6: nums[5],
    bonus_num: 1,
  }
}

describe('buildHistCounts', () => {
  it('기준 회차 미만만 집계한다', () => {
    const rows = [
      mkRow(1, [1, 2, 3, 4, 5, 6]),
      mkRow(2, [1, 7, 8, 9, 10, 11]),
      mkRow(3, [1, 12, 13, 14, 15, 16]),
    ]
    const c = buildHistCounts(rows, 3)
    expect(c[0]).toBe(2)
    expect(c[6]).toBe(1)
    expect(c[11]).toBe(0)
  })
})

describe('repairOneStep', () => {
  it('band 위반 자리는 목표 band 구간 후보만 사용한다', () => {
    const pool = Array.from({ length: 30 }, (_, i) => i + 1)
    const poolByBand = buildPoolByBand(pool)
    const sorted = [1, 6, 12, 13, 21, 26]
    const constraints = {
      minSum: 50,
      maxSum: 200,
      evenT: 3,
      runT: 2,
      bandTargets: [0, 1, 2, 2, 2, 5],
    }
    const hist = Array.from({ length: 45 }, () => 0)
    hist[20] = 99
    const before = validateSet(sorted, constraints)
    expect(before.violations).toContain('band')
    const ok = repairOneStep(sorted, before, constraints, poolByBand, hist)
    expect(ok).toBe(true)
    expect(numberToBandIndex(sorted[4])).toBe(2)
    expect([13, 14]).toContain(sorted[4])
  })
})

describe('randomBandSeed', () => {
  it('자리별 band 목표에 맞는 오름차순 6개를 만든다', () => {
    const pool = Array.from({ length: 30 }, (_, i) => i + 1)
    const poolByBand = buildPoolByBand(pool)
    const targets = [0, 1, 2, 3, 4, 5]
    const sorted = randomBandSeed(poolByBand, targets)
    expect(sorted).not.toBeNull()
    if (!sorted) return
    for (let i = 0; i < 6; i++) {
      expect(numberToBandIndex(sorted[i])).toBe(targets[i])
    }
    for (let i = 1; i < 6; i++) {
      expect(sorted[i]).toBeGreaterThan(sorted[i - 1])
    }
  })
})
