import { describe, expect, it } from 'vitest'
import type { WinningNumberRow } from '@/app/analysis/chi-square/types'
import {
  generateCombinationBasedSets,
  TARGET_SET_COUNT,
} from '@/app/recommend/logic/combinationBasedSets'
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
 * 극단 트림(상·하위 %) 이후에도 작은 채택 풀(예: 1~14)의 합이 들어갈 수 있도록,
 * 저합·고합 회차를 섞은 가짜 이력을 만든다.
 */
function syntheticHistory(count: number): WinningNumberRow[] {
  const rows: WinningNumberRow[] = []
  for (let i = 0; i < count; i++) {
    const nums: [number, number, number, number, number, number] =
      i % 2 === 0 ? [1, 2, 3, 4, 5, 6] : [40, 41, 42, 43, 44, 45]
    rows.push(mkRow(i + 1, nums))
  }
  return rows
}

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
    /** C(14,6) 수준으로 조합 순회 비용을 제한 */
    const adopted = Array.from({ length: 14 }, (_, i) => i + 1)
    const r = await generateCombinationBasedSets(hist, adopted, 0)
    expect(r.sets.length).toBe(TARGET_SET_COUNT)
    expect(r.summaryLines.some((l) => l.includes('고저 합산'))).toBe(true)
    expect(r.summaryLines.some((l) => l.includes('세트 구성:'))).toBe(true)
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
    const counts = adopted.map((n) => usage.get(n) ?? 0)
    const minCount = Math.min(...counts)
    /** 30×6 / 14 ≈ 12.9 — 사용 빈도 기반 선택으로 풀 전체가 고르게 등장해야 한다 */
    expect(minCount).toBeGreaterThanOrEqual(8)
  })
})
