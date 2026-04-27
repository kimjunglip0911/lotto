import { GeneratedSet } from '@/app/recommend/logic/types'

export function mkPairKey(a: number, b: number): string {
  return a < b ? `${a},${b}` : `${b},${a}`
}

export function mkTripleKey(a: number, b: number, c: number): string {
  const [x, y, z] = [a, b, c].sort((i, j) => i - j)
  return `${x},${y},${z}`
}

export function scoreCoverageGain(
  nums: number[],
  coveredPairs: Set<string>,
  coveredTriples: Set<string>,
): number {
  let newPairs = 0
  let newTriples = 0
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (!coveredPairs.has(mkPairKey(nums[i], nums[j]))) newPairs++
      for (let k = j + 1; k < nums.length; k++) {
        if (!coveredTriples.has(mkTripleKey(nums[i], nums[j], nums[k]))) newTriples++
      }
    }
  }
  // "당첨번호가 풀에 있는데 놓침"을 줄이기 위해 조합 커버리지를 강하게 가중
  return newTriples * 8 + newPairs * 2
}

export function registerCoverage(
  nums: number[],
  coveredPairs: Set<string>,
  coveredTriples: Set<string>,
): void {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      coveredPairs.add(mkPairKey(nums[i], nums[j]))
      for (let k = j + 1; k < nums.length; k++) {
        coveredTriples.add(mkTripleKey(nums[i], nums[j], nums[k]))
      }
    }
  }
}

export function combinations(
  nums: number[],
  pick: number,
  onPick: (combo: number[]) => void,
): void {
  const selected: number[] = []
  const dfs = (start: number) => {
    if (selected.length === pick) {
      onPick([...selected])
      return
    }
    const remain = pick - selected.length
    for (let i = start; i <= nums.length - remain; i++) {
      selected.push(nums[i])
      dfs(i + 1)
      selected.pop()
    }
  }
  dfs(0)
}

export function buildSetFromIndices(pool: number[], indices: number[]): number[] | null {
  const picked = indices.map((idx) => pool[idx])
  const uniq = [...new Set(picked)].sort((a, b) => a - b)
  if (uniq.length !== 6) return null
  return uniq
}

export function topUpWithRotatingPatterns(
  pool: number[],
  usageCount: Map<number, number>,
  usedSetKeys: Set<string>,
  coveredPairs: Set<string>,
  coveredTriples: Set<string>,
  targetCount: number,
  sets: GeneratedSet[],
): void {
  const N = pool.length
  if (N < 6) return

  for (let step = 1; step < N && sets.length < targetCount; step++) {
    for (let start = 0; start < N && sets.length < targetCount; start++) {
      const indices = Array.from({ length: 6 }, (_, k) => (start + k * step) % N)
      const nums = buildSetFromIndices(pool, indices)
      if (!nums) continue
      const key = nums.join(',')
      if (usedSetKeys.has(key)) continue

      usedSetKeys.add(key)
      for (const n of nums) usageCount.set(n, (usageCount.get(n) ?? 0) + 1)
      registerCoverage(nums, coveredPairs, coveredTriples)
      sets.push({
        num1: nums[0],
        num2: nums[1],
        num3: nums[2],
        num4: nums[3],
        num5: nums[4],
        num6: nums[5],
        method: 'JL Wheel Method',
        strategy: 'deterministic',
      })
    }
  }
}
