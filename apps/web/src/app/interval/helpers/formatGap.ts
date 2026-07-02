/**
 * 번호별 간격 표에 들어가는 숫자를 사람이 읽기 쉬운 글자로 바꿉니다.
 *
 * 하는 일
 * - 값이 없으면 `-`로 보여 줍니다.
 * - 평균은 소수점이 필요할 때만 짧게 보여 줍니다.
 *
 * 실패·주의
 * - 계산 자체는 하지 않고, 화면 표시용 글자만 만듭니다.
 */

export const formatGap = (value: number | null): string =>
  value == null ? '-' : value.toLocaleString('ko-KR', { maximumFractionDigits: 2 });

export const formatList = (values: readonly number[]): string =>
  values.length === 0 ? '-' : values.join(', ');
