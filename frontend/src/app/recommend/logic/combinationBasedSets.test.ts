import { describe, expect, it } from 'vitest'
import type { WinningNumberRow } from '@/app/analysis/chi-square/types'
import {
  bandInnerSlot,
  COMBO_RANK_TRIPLE_PRIORITY_ORDER,
  generateCombinationBasedSets,
  TARGET_SET_COUNT,
} from '@/app/recommend/logic/combinationBasedSets'
import { numberToBandIndex } from '@/app/analysis/combination/logic/buildPositionBandDistribution'
import type { GeneratedSet } from '@/app/recommend/logic/types'

function countUsageInPool(sets: GeneratedSet[], pool: number[]): Map<number, number> {
  const u = new Map<number, number>(pool.map((n) => [n, 0]))
  for (const s of sets) {
    for (const n of [s.num1, s.num2, s.num3, s.num4, s.num5, s.num6]) {
      u.set(n, (u.get(n) ?? 0) + 1)
    }
  }
  return u
}

function mkRow(drawNo: number, nums: [number, number, number, number, number, number]): WinningNumberRow {
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

/**
 * 본번호가 모두 1~20 안에 있어 채택 풀 1~20과 자리대 분포가 충돌하지 않게 한다.
 * 합은 저·중간을 섞어 트림 후에도 풀 내 합 범위와 겹치게 한다.
 */
const SYNTHETIC_MAIN_PATTERNS: [number, number, number, number, number, number][] = [
  [1, 2, 3, 4, 5, 6],
  [15, 16, 17, 18, 19, 20],
  [7, 8, 9, 10, 11, 12],
  [2, 4, 6, 8, 10, 12],
  [5, 7, 9, 11, 13, 15],
  [3, 6, 9, 12, 15, 18],
  [4, 8, 12, 16, 17, 18],
  [1, 5, 10, 14, 18, 20],
]

function syntheticHistory(count: number): WinningNumberRow[] {
  const rows: WinningNumberRow[] = []
  for (let i = 0; i < count; i++) {
    const nums = SYNTHETIC_MAIN_PATTERNS[i % SYNTHETIC_MAIN_PATTERNS.length]
    rows.push(mkRow(i + 1, nums))
  }
  return rows
}

describe('bandInnerSlot', () => {
  it('maps numbers into 0~4 slots within each 5-number band', () => {
    expect(bandInnerSlot(1)).toBe(0)
    expect(bandInnerSlot(5)).toBe(4)
    expect(bandInnerSlot(6)).toBe(0)
    expect(bandInnerSlot(16)).toBe(0)
    expect(bandInnerSlot(18)).toBe(2)
    expect(bandInnerSlot(45)).toBe(4)
  })
})

function innerSlotsUsedInSets(sets: GeneratedSet[]): Map<number, Set<number>> {
  const byBand = new Map<number, Set<number>>()
  for (const s of sets) {
    for (const n of [s.num1, s.num2, s.num3, s.num4, s.num5, s.num6]) {
      const b = numberToBandIndex(n)
      const slots = byBand.get(b) ?? new Set<number>()
      slots.add(bandInnerSlot(n))
      byBand.set(b, slots)
    }
  }
  return byBand
}

describe('COMBO_RANK_TRIPLE_PRIORITY_ORDER', () => {
  it('같은 (oe, run)에서 band 1→2→3 다음에 run이 증가한다', () => {
    expect(COMBO_RANK_TRIPLE_PRIORITY_ORDER.slice(0, 6)).toEqual([
      [1, 1, 1],
      [1, 1, 2],
      [1, 1, 3],
      [1, 2, 1],
      [1, 2, 2],
      [1, 2, 3],
    ])
  })
})

describe('generateCombinationBasedSets', () => {
  it('채택 풀이 6개 미만이면 세트를 만들지 않는다', async () => {
    const hist = syntheticHistory(40)
    const r = await generateCombinationBasedSets(hist, [1, 2, 3], 0)
    expect(r.sets).toHaveLength(0)
    expect(r.warning).toBeTruthy()
  })

  it('이력이 비어 있으면 합산 통계 부재로 세트를 만들지 않는다', async () => {
    const r = await generateCombinationBasedSets([], Array.from({ length: 20 }, (_, i) => i + 1), 0)
    expect(r.sets).toHaveLength(0)
    expect(r.summaryLines.some((l) => l.includes('고저 합산'))).toBe(true)
  })

  it('이력이 있으면 조합 요약이 생기고, 목표 개수·중복 없음·채택 풀·분산이 만족된다', async () => {
    const hist = syntheticHistory(80)
    /** 자리별 band 목표(21~25 등)를 채울 수 있도록 풀을 1~45로 둔다 */
    const adopted = Array.from({ length: 45 }, (_, i) => i + 1)
    const referenceDrawNo = 81
    const r = await generateCombinationBasedSets(hist, adopted, referenceDrawNo)
    expect(r.sets.length).toBe(TARGET_SET_COUNT)
    expect(r.sets.every((s) => /^combo:oe\d+-run\d+-band[123]$/.test(s.strategy ?? ''))).toBe(true)
    expect(r.summaryLines.some((l) => l.includes('고저 합산'))).toBe(true)
    expect(r.summaryLines.some((l) => l.includes('세트 구성:'))).toBe(true)
    expect(r.summaryLines.some((l) => l.includes(String(referenceDrawNo)))).toBe(true)
    const keys = new Set(
      r.sets.map((s) => [s.num1, s.num2, s.num3, s.num4, s.num5, s.num6].sort((a, b) => a - b).join(',')),
    )
    expect(keys.size).toBe(r.sets.length)
    for (const s of r.sets) {
      const nums = [s.num1, s.num2, s.num3, s.num4, s.num5, s.num6]
      expect(new Set(nums).size).toBe(6)
      for (const n of nums) {
        expect(adopted.includes(n)).toBe(true)
      }
    }
    const usage = countUsageInPool(r.sets, adopted)
    const distinctUsed = adopted.filter((n) => (usage.get(n) ?? 0) > 0).length
    /** 랭크·겹침 점수로 일부 번호는 안 쓰일 수 있으나, 풀의 상당 부분은 등장해야 한다 */
    expect(distinctUsed).toBeGreaterThanOrEqual(12)

    const slotsByBand = innerSlotsUsedInSets(r.sets)
    const bandsWithSpread = [...slotsByBand.values()].filter((slots) => slots.size >= 2).length
    expect(bandsWithSpread).toBeGreaterThanOrEqual(1)

  })
})
