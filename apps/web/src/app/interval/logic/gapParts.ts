/**
 * 번호별 간격 계산의 작은 보조 함수 모음입니다.
 *
 * 하는 일
 * - 한 회차의 주번호만 꺼냅니다.
 * - 연속 출현 묶음을 접고 다음 출현까지의 간격을 만듭니다.
 * - 간격 평균을 소수점 첫째 자리에서 반올림해 계산합니다.
 *
 * 실패·주의
 * - 보너스 번호는 의도적으로 포함하지 않습니다.
 */

export { toMainNumbersOnly } from '@/lib/accu-nums/logic/numCounts';

export const buildGaps = (draws: readonly number[]): number[] => {
  const gaps: number[] = [];
  let base = draws[0];
  for (let index = 1; index < draws.length; index++) {
    const current = draws[index];
    if (current === base + 1) {
      base = current;
      continue;
    }
    gaps.push(current - base);
    base = current;
  }
  return gaps;
};

export const avgGap = (values: readonly number[]): number | null =>
  values.length === 0
    ? null
    : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
