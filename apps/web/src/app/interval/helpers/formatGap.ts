/**
 * 미추첨 간격 표에 들어가는 숫자를 사람이 읽기 쉬운 글자로 바꿉니다.
 */

export const formatGap = (value: number | null): string =>
  value == null ? '-' : value.toLocaleString('ko-KR');
