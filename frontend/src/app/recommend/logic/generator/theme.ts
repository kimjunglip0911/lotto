export type Band = 'front' | 'middle' | 'back'

export interface ThemeSpec {
  label: string
  pairInBand?: Band
  tripleInBand?: Band
  pairCountMin?: number
  noConsecutive?: boolean
  oddMin?: number
  oddMax?: number
  bandMin?: Partial<Record<Band, number>>
  bandMax?: Partial<Record<Band, number>>
  sumMin?: number
  sumMax?: number
  uniqueLastDigit?: boolean
  primeMin?: number
  primeMax?: number
  preferLow?: boolean
  preferHigh?: boolean
  preferOdd?: boolean
  preferEven?: boolean
  preferPrime?: boolean
  preferBand?: Band
}

export const PRIME_NUMBERS = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43])

export const THEME_SPECS: ThemeSpec[] = [
  { label: '앞번호 연속 2개', pairInBand: 'front', preferBand: 'front', preferLow: true },
  { label: '뒷번호 연속 2개', pairInBand: 'back', preferBand: 'back', preferHigh: true },
  { label: '중간번호 연속 2개', pairInBand: 'middle', preferBand: 'middle' },
  { label: '연속 숫자 없음', noConsecutive: true },
  { label: '앞번호 연속 3개', tripleInBand: 'front', preferBand: 'front', preferLow: true },
  { label: '뒷번호 연속 3개', tripleInBand: 'back', preferBand: 'back', preferHigh: true },
  // 1209회(2,17,20,35,37,39) 패턴: 고구간 중심이지만 저/중구간도 함께 포함된 혼합형
  { label: '1209 패턴(저중고 혼합+홀수 강세)', bandMin: { front: 1, middle: 1, back: 2 }, oddMin: 3, preferHigh: true, preferOdd: true, preferLow: true },
  // 1219회(1,2,15,28,39,45) 패턴: 앞구간 연속 + 고구간 포함
  { label: '1219 패턴(앞연속+고구간)', pairInBand: 'front', bandMin: { back: 2 }, oddMin: 4, preferHigh: true, preferLow: true },
  { label: '홀수 강세', oddMin: 4, oddMax: 5, preferOdd: true },
  { label: '짝수 강세', oddMin: 1, oddMax: 2, preferEven: true },
  { label: '중간번호 연속 3개', tripleInBand: 'middle', preferBand: 'middle' },
  { label: '연속 2쌍', pairCountMin: 2 },
  { label: '홀짝 균형', oddMin: 3, oddMax: 3 },
  { label: '저구간 강세', bandMin: { front: 3 }, bandMax: { back: 2 }, preferLow: true, preferBand: 'front' },
  { label: '중구간 강세', bandMin: { middle: 3 }, bandMax: { back: 2 }, preferBand: 'middle' },
  { label: '고구간 강세', bandMin: { back: 3 }, bandMax: { front: 2 }, preferHigh: true, preferBand: 'back' },
  { label: '저중고 균형', bandMin: { front: 2, middle: 2, back: 2 }, bandMax: { front: 2, middle: 2, back: 2 } },
  { label: '합계 낮은 조합', sumMax: 130, preferLow: true },
  { label: '합계 높은 조합', sumMin: 160, preferHigh: true },
  { label: '끝수 분산 조합', uniqueLastDigit: true },
  { label: '소수 중심 조합', primeMin: 3, primeMax: 4, preferPrime: true },
  { label: '합성수 중심 조합', primeMin: 1, primeMax: 2, preferEven: true },
]

export function getBand(n: number): Band {
  if (n <= 15) return 'front'
  if (n <= 30) return 'middle'
  return 'back'
}

export function isInBand(n: number, band: Band): boolean {
  return getBand(n) === band
}

function countConsecutivePairs(nums: number[]): number {
  let count = 0
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i + 1] - nums[i] === 1) count++
  }
  return count
}

function hasConsecutiveRunInBand(nums: number[], runLength: number, band: Band): boolean {
  for (let i = 0; i <= nums.length - runLength; i++) {
    let ok = true
    for (let j = i; j < i + runLength - 1; j++) {
      if (nums[j + 1] - nums[j] !== 1) {
        ok = false
        break
      }
    }
    if (!ok) continue
    for (let j = i; j < i + runLength; j++) {
      if (!isInBand(nums[j], band)) {
        ok = false
        break
      }
    }
    if (ok) return true
  }
  return false
}

function countNonOverlappingPairRuns(nums: number[]): number {
  let count = 0
  let i = 0
  while (i < nums.length - 1) {
    if (nums[i + 1] - nums[i] === 1) {
      count++
      i += 2
      continue
    }
    i++
  }
  return count
}

function countByBand(nums: number[]): Record<Band, number> {
  const out: Record<Band, number> = { front: 0, middle: 0, back: 0 }
  for (const n of nums) out[getBand(n)]++
  return out
}

function countOdd(nums: number[]): number {
  return nums.filter((n) => n % 2 !== 0).length
}

function countPrime(nums: number[]): number {
  return nums.filter((n) => PRIME_NUMBERS.has(n)).length
}

function hasUniqueLastDigit(nums: number[]): boolean {
  return new Set(nums.map((n) => n % 10)).size === nums.length
}

export function satisfyTheme(nums: number[], spec: ThemeSpec): boolean {
  const oddCount = countOdd(nums)
  const sum = nums.reduce((acc, cur) => acc + cur, 0)
  const bandCount = countByBand(nums)
  const primeCount = countPrime(nums)

  if (spec.noConsecutive && countConsecutivePairs(nums) > 0) return false
  if (spec.pairInBand && !hasConsecutiveRunInBand(nums, 2, spec.pairInBand)) return false
  if (spec.tripleInBand && !hasConsecutiveRunInBand(nums, 3, spec.tripleInBand)) return false
  if ((spec.pairCountMin ?? 0) > 0 && countNonOverlappingPairRuns(nums) < (spec.pairCountMin ?? 0)) return false
  if ((spec.oddMin ?? 0) > oddCount) return false
  if ((spec.oddMax ?? 6) < oddCount) return false
  if ((spec.sumMin ?? 0) > sum) return false
  if ((spec.sumMax ?? 300) < sum) return false
  if (spec.uniqueLastDigit && !hasUniqueLastDigit(nums)) return false
  if ((spec.primeMin ?? 0) > primeCount) return false
  if ((spec.primeMax ?? 6) < primeCount) return false

  for (const band of ['front', 'middle', 'back'] as const) {
    if ((spec.bandMin?.[band] ?? 0) > bandCount[band]) return false
    if ((spec.bandMax?.[band] ?? 6) < bandCount[band]) return false
  }

  return true
}

export function relaxThemeSpec(spec: ThemeSpec): ThemeSpec {
  return {
    ...spec,
    // 핵심 테마 조건은 유지하고, 생성 실패를 일으키기 쉬운 제한만 완화한다.
    pairCountMin: spec.pairCountMin ? Math.max(1, spec.pairCountMin - 1) : spec.pairCountMin,
    oddMin: spec.oddMin ? Math.max(0, spec.oddMin - 1) : spec.oddMin,
    oddMax: spec.oddMax ? Math.min(6, spec.oddMax + 1) : spec.oddMax,
    sumMin: spec.sumMin ? Math.max(21, spec.sumMin - 10) : spec.sumMin,
    sumMax: spec.sumMax ? Math.min(255, spec.sumMax + 10) : spec.sumMax,
    primeMin: spec.primeMin ? Math.max(0, spec.primeMin - 1) : spec.primeMin,
    primeMax: spec.primeMax ? Math.min(6, spec.primeMax + 1) : spec.primeMax,
    bandMin: spec.bandMin
      ? {
          front: spec.bandMin.front ? Math.max(0, spec.bandMin.front - 1) : spec.bandMin.front,
          middle: spec.bandMin.middle ? Math.max(0, spec.bandMin.middle - 1) : spec.bandMin.middle,
          back: spec.bandMin.back ? Math.max(0, spec.bandMin.back - 1) : spec.bandMin.back,
        }
      : spec.bandMin,
    bandMax: spec.bandMax
      ? {
          front: spec.bandMax.front ? Math.min(6, spec.bandMax.front + 1) : spec.bandMax.front,
          middle: spec.bandMax.middle ? Math.min(6, spec.bandMax.middle + 1) : spec.bandMax.middle,
          back: spec.bandMax.back ? Math.min(6, spec.bandMax.back + 1) : spec.bandMax.back,
        }
      : spec.bandMax,
  }
}
