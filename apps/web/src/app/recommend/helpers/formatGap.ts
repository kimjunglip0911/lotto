/**
 * 추천 결과 표에 간격 숫자를 짧게 보여 주는 형식 변환입니다.
 *
 * 하는 일
 * - 값이 없으면 `-`로, 있으면 회차 간격 숫자로 표시합니다.
 */

export const formatGapCell = (value: number | null): string =>
  value == null ? '—' : String(value);
