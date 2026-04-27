export function normalizeNumberList(numbers: number[]): number[] {
  return [...new Set(numbers)].sort((a, b) => a - b)
}

/**
 * 기존 규칙 구현과 동일한 방식으로 "상위 퍼센타일 시작값"을 계산한다.
 * 예: percentile=0.95 이면 상위 5% 시작 경계를 반환한다.
 */
export function getTopPercentileThreshold(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(Math.ceil(sorted.length * percentile) - 1, sorted.length - 1)
  return sorted[idx]
}
