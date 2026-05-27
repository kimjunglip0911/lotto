import { describe, expect, it } from 'vitest'
import type { WinningNumberRow } from '@/app/analysis/chi-square/types'
import type { PositionBandDistributionRow } from '@/app/analysis/combination/types'
import {
  bandInnerSlot,
  areBandTargetsMonotonic,
  buildBandTargetsPerPosition,
  effectiveBandRankIdx,
  MIN_BAND_TIER_PERCENT,
  COMBO_PROFILE_SLOT_CYCLE,
  COMBO_PROFILE_SLOT_ORDER,
  COMBO_RANK_TRIPLE_PRIORITY_ORDER,
  generateCombinationBasedSets,
  TARGET_SET_COUNT,
} from '@/app/recommend/logic/combo'
import { numberToBandIndex } from '@/app/analysis/combination/logic/numberToBand'
import type { GeneratedSet } from '@/app/recommend/types/generatedSet'

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

describe('buildBandTargetsPerPosition', () => {
  it('band4는 자리마다 비율 4등(서로 다른 band) 구간을 고른다', () => {
    const rows: PositionBandDistributionRow[] = []
    for (let pos = 1; pos <= 6; pos++) {
      const bands = [
        { label: '1~5', pct: 40 - pos },
        { label: '6~10', pct: 30 - pos },
        { label: '11~15', pct: 20 - pos },
        { label: '16~20', pct: 10 - pos },
      ] as const
      for (const b of bands) {
        rows.push({
          position: pos,
          bandLabel: b.label,
          count: 1,
          percentage: b.pct,
        })
      }
    }
    const t1 = buildBandTargetsPerPosition(rows, 1)!
    const t2 = buildBandTargetsPerPosition(rows, 2, t1)!
    const t3 = buildBandTargetsPerPosition(rows, 3, t2)!
    const t4 = buildBandTargetsPerPosition(rows, 4, t3)!
    expect(t1).toHaveLength(6)
    expect(t4).toHaveLength(6)
    for (let i = 0; i < 6; i++) {
      expect(t4[i]).not.toBe(t1[i])
    }
    expect(t4.join(',')).not.toBe(t3.join(','))
    expect(areBandTargetsMonotonic(t1)).toBe(true)
    expect(t4.join(',')).not.toBe(t3.join(','))
  })

  it('N등 비율이 20% 미만인 자리는 band3 목표에서 1등 구간을 쓴다', () => {
    const rows: PositionBandDistributionRow[] = []
    const pos1Bands = [
      { label: '1~5', pct: 50 },
      { label: '6~10', pct: 25 },
      { label: '11~15', pct: 13 },
      { label: '16~20', pct: 12 },
    ] as const
    for (let pos = 1; pos <= 6; pos++) {
      const bands =
        pos === 1
          ? pos1Bands
          : ([
              { label: '1~5', pct: 40 },
              { label: '6~10', pct: 30 },
              { label: '11~15', pct: 20 },
              { label: '16~20', pct: 10 },
            ] as const)
      for (const b of bands) {
        rows.push({
          position: pos,
          bandLabel: b.label,
          count: 1,
          percentage: b.pct,
        })
      }
    }
    const t1 = buildBandTargetsPerPosition(rows, 1)!
    const t3 = buildBandTargetsPerPosition(rows, 3)!
    expect(t3[0]).toBe(t1[0])
    const sortedPos1 = rows
      .filter((r) => r.position === 1)
      .sort((a, b) => b.percentage - a.percentage)
    expect(sortedPos1[2]!.percentage).toBe(13)
    expect(sortedPos1[2]!.percentage).toBeLessThan(MIN_BAND_TIER_PERCENT)
    expect(effectiveBandRankIdx(sortedPos1, 2)).toBe(0)
    expect(t3[1]).not.toBe(t1[1])
  })

  it('자리별 4등 목표는 슬롯 간 비내림 보정 없이 표 통계를 따른다', () => {
    const rows: PositionBandDistributionRow[] = []
    const pos2Bands = [
      { label: '16~20', pct: 40 },
      { label: '21~25', pct: 30 },
      { label: '11~15', pct: 20 },
      { label: '1~5', pct: 10 },
    ] as const
    for (let pos = 1; pos <= 6; pos++) {
      const bands =
        pos === 2
          ? pos2Bands
          : ([
              { label: '16~20', pct: 50 },
              { label: '21~25', pct: 30 },
              { label: '26~30', pct: 15 },
              { label: '31~35', pct: 5 },
            ] as const)
      for (const b of bands) {
        rows.push({
          position: pos,
          bandLabel: b.label,
          count: 1,
          percentage: b.pct,
        })
      }
    }
    const t4 = buildBandTargetsPerPosition(rows, 4)!
    expect(t4[1]).toBe(0)
    expect(t4[0]).toBeGreaterThan(t4[1]!)
    expect(areBandTargetsMonotonic(t4)).toBe(false)
  })
})

describe('COMBO_PROFILE_SLOT_ORDER', () => {
  it('15패턴+5슬롯 재시도·band1~3', () => {
    expect(COMBO_PROFILE_SLOT_CYCLE).toHaveLength(15)
    expect(COMBO_PROFILE_SLOT_ORDER).toHaveLength(TARGET_SET_COUNT)
    expect(COMBO_PROFILE_SLOT_ORDER.every(([, , band]) => band <= 3)).toBe(true)
    expect(COMBO_PROFILE_SLOT_ORDER.slice(0, 15)).toEqual([...COMBO_PROFILE_SLOT_CYCLE])
    expect(COMBO_PROFILE_SLOT_ORDER.slice(15)).toEqual(
      [...COMBO_PROFILE_SLOT_CYCLE].slice(0, 5),
    )
    expect(COMBO_RANK_TRIPLE_PRIORITY_ORDER).toEqual([...COMBO_PROFILE_SLOT_ORDER])
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

  it(
    '이력이 있으면 조합 요약이 생기고, 목표 개수·중복 없음·채택 풀·분산이 만족된다',
    async () => {
    const hist = syntheticHistory(80)
    const adopted = Array.from({ length: 29 }, (_, i) => i + 1)
    const referenceDrawNo = 81
    const r = await generateCombinationBasedSets(hist, adopted, referenceDrawNo)
    expect(r.sets.length).toBeGreaterThan(0)
    expect(r.sets.length).toBeLessThanOrEqual(TARGET_SET_COUNT)
    expect(r.sets.every((s) => /^combo:oe\d+-run\d+-band[123]$/.test(s.strategy ?? ''))).toBe(true)
    const bandTiers = new Set(
      r.sets.map((s) => {
        const m = /band(\d+)$/.exec(s.strategy ?? '')
        return m ? Number(m[1]) : 0
      }),
    )
    expect(bandTiers.has(4)).toBe(false)
    expect(r.summaryLines.some((l) => l.includes('고저 합산'))).toBe(true)
    expect(r.summaryLines.some((l) => l.includes('세트 구성:'))).toBe(true)
    expect(r.summaryLines.some((l) => l.includes('10회'))).toBe(true)
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
    },
    120_000,
  )
})
