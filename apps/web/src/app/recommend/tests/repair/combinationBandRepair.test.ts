import { describe, expect, it } from 'vitest'
import type { WinningNumberRow } from '@/app/analysis/chi-square/types'
import { numberToBandIndex } from '@/app/analysis/combination/logic/numberToBand'
import {
  buildHistCounts,
  buildMetricsOnlyFromPool,
  buildOneSetWithFallback,
  buildPoolByBand,
  canPickBandSkeleton,
  forceBuildOneSet,
  hasFallbackBothMetricsOk,
  hasFallbackMetricOk,
  PROFILE_BUILD_ATTEMPTS,
  randomPerPositionPick,
  repairOneStep,
  sortPickedAsc,
  validateMetricsOnly,
  validatePickedSet,
  validateSet,
} from '@/app/recommend/logic/repair'

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
  it('band 위반 자리는 목표 band·폴백 band(4~6) 후보로 수리한다', () => {
    const pool = Array.from({ length: 30 }, (_, i) => i + 1)
    const poolByBand = buildPoolByBand(pool)
    const picked = [1, 6, 12, 13, 35, 26]
    const constraints = {
      minSum: 50,
      maxSum: 200,
      evenT: 3,
      runT: 2,
      bandTargets: [0, 1, 2, 2, 2, 5],
    }
    const usage = new Map<number, number>()
    for (let i = 1; i <= 30; i++) usage.set(i, 0)
    usage.set(21, 99)
    const before = validatePickedSet(picked, constraints)
    expect(before.violations).toContain('band')
    const ok = repairOneStep(picked, before, constraints, poolByBand, { usage })
    expect(ok).toBe(true)
    expect(numberToBandIndex(picked[4]!)).toBe(2)
    expect([11, 12, 13, 14, 15]).toContain(picked[4]!)
  })

  it('band1~3 목표에 band4~6 번호는 band 위반이 아니다', () => {
    const picked = [1, 6, 12, 13, 21, 26]
    const constraints = {
      minSum: 50,
      maxSum: 200,
      evenT: 3,
      runT: 2,
      bandTargets: [0, 1, 2, 2, 2, 5],
    }
    const before = validatePickedSet(picked, constraints)
    expect(before.violations).not.toContain('band')
  })
})

describe('forceBuildOneSet', () => {
  it('채택 풀이 작을 때 BFS·백트래킹으로 제약을 맞출 수 있다', () => {
    const pool = Array.from({ length: 28 }, (_, i) => i + 1)
    const poolByBand = buildPoolByBand(pool)
    const constraints = {
      minSum: 40,
      maxSum: 200,
      evenT: 3,
      runT: 1,
      bandTargets: [0, 1, 2, 3, 4, 5],
    }
    const sorted = forceBuildOneSet(poolByBand, constraints)
    expect(sorted).not.toBeNull()
    expect(validateSet(sorted!, constraints).ok).toBe(true)
  })

  it('합·홀짝·연속·band 제약을 만족하는 6개를 만든다', () => {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1)
    const poolByBand = buildPoolByBand(pool)
    const constraints = {
      minSum: 21,
      maxSum: 255,
      evenT: 3,
      runT: 1,
      bandTargets: [0, 1, 2, 3, 4, 5],
    }
    const sorted = forceBuildOneSet(poolByBand, constraints)
    expect(sorted).not.toBeNull()
    if (!sorted) return
    const state = validateSet(sorted, constraints)
    expect(state.ok).toBe(true)
  })

})

describe('validateSet', () => {
  it('같은 번호가 두 번 들어가면 duplicate 위반이다', () => {
    const constraints = {
      minSum: 1,
      maxSum: 300,
      evenT: 3,
      runT: 2,
      bandTargets: [0, 1, 2, 3, 4, 5],
    }
    const state = validateSet([1, 2, 32, 32, 40, 45], constraints)
    expect(state.ok).toBe(false)
    expect(state.violations).toContain('duplicate')
  })
})

describe('hasFallbackBothMetricsOk', () => {
  it('홀짝·연속이 모두 맞으면 true', () => {
    const constraints = {
      minSum: 1,
      maxSum: 300,
      evenT: 3,
      runT: 1,
      bandTargets: [0, 1, 2, 3, 4, 5],
    }
    expect(hasFallbackBothMetricsOk([1, 3, 5, 8, 10, 12], constraints)).toBe(true)
    expect(hasFallbackBothMetricsOk([1, 3, 5, 7, 9, 11], constraints)).toBe(false)
  })
})

describe('hasFallbackMetricOk', () => {
  it('홀짝 또는 연속 중 하나만 맞아도 true', () => {
    const constraints = {
      minSum: 1,
      maxSum: 300,
      evenT: 3,
      runT: 1,
      bandTargets: [0, 1, 2, 3, 4, 5],
    }
    expect(hasFallbackMetricOk([1, 3, 5, 7, 9, 11], constraints)).toBe(true)
    expect(hasFallbackMetricOk([1, 3, 5, 7, 9, 20], constraints)).toBe(true)
    expect(hasFallbackMetricOk([1, 2, 3, 4, 5, 7], constraints)).toBe(false)
  })
})

describe('buildMetricsOnlyFromPool', () => {
  it('자리 band 후보가 없어도 합·홀짝·연속을 맞출 수 있다', () => {
    const pool = Array.from({ length: 30 }, (_, i) => i + 1)
    const poolByBand = buildPoolByBand(pool)
    const constraints = {
      minSum: 50,
      maxSum: 200,
      evenT: 3,
      runT: 1,
      bandTargets: [0, 1, 2, 3, 4, 8],
    }
    expect(canPickBandSkeleton(poolByBand, constraints.bandTargets, {})).toBe(false)
    const sorted = buildMetricsOnlyFromPool(poolByBand, constraints, {}, 24)
    expect(sorted).not.toBeNull()
    if (!sorted) return
    expect(validateMetricsOnly(sorted, constraints).ok).toBe(true)
    expect(validateSet(sorted, constraints).ok).toBe(false)
  })
})

describe('buildOneSetWithFallback', () => {
  it('PROFILE_BUILD_ATTEMPTS회 실패 시 폴백으로 홀짝·연속 중 1개 이상 맞춘 6개를 반환한다', () => {
    const pool = Array.from({ length: 30 }, (_, i) => i + 1)
    const poolByBand = buildPoolByBand(pool)
    const constraints = {
      minSum: 1,
      maxSum: 2,
      evenT: 0,
      runT: 1,
      bandTargets: [0, 1, 2, 3, 4, 5],
    }
    const r = buildOneSetWithFallback(poolByBand, constraints, {}, PROFILE_BUILD_ATTEMPTS)
    expect(r).not.toBeNull()
    if (!r) return
    expect(r.sorted).toHaveLength(6)
    expect(r.usedFallback).toBe(true)
    expect(hasFallbackMetricOk(r.sorted, constraints)).toBe(true)
    expect(validateSet(r.sorted, constraints).ok).toBe(false)
  })
})

describe('randomPerPositionPick', () => {
  it('구간마다 band 목표에서 1개씩 뽑고, 정렬하면 오름차순이다', () => {
    const pool = Array.from({ length: 30 }, (_, i) => i + 1)
    const poolByBand = buildPoolByBand(pool)
    const targets = [0, 1, 2, 3, 4, 5]
    const picked = randomPerPositionPick(poolByBand, targets)
    expect(picked).not.toBeNull()
    if (!picked) return
    for (let i = 0; i < 6; i++) {
      expect(numberToBandIndex(picked[i])).toBe(targets[i])
    }
    const asc = sortPickedAsc(picked)
    for (let i = 1; i < 6; i++) {
      expect(asc[i]).toBeGreaterThan(asc[i - 1])
    }
  })

  it('1번 구간·2번 구간은 크기 순서와 무관하게 뽑을 수 있다', () => {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1)
    const poolByBand = buildPoolByBand(pool)
    const targets = [1, 0, 2, 3, 4, 5]
    let sawHighThenLow = false
    for (let t = 0; t < 40; t++) {
      const picked = randomPerPositionPick(poolByBand, targets)
      if (!picked) continue
      if (picked[0]! > picked[1]!) {
        sawHighThenLow = true
        break
      }
    }
    expect(sawHighThenLow).toBe(true)
  })
})
