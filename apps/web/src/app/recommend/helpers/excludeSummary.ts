/** 직전 당첨 제외 요약 한 줄 */

export const formatExcludeSummary = (excluded: readonly number[]): string =>
  excluded.length > 0
    ? `직전 당첨 제외: ${excluded.join(', ')} (${excluded.length}개)`
    : '직전 당첨 제외: 해당 회차 없음';
