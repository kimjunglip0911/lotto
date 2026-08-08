/** 균등·직전 제외 요약 한 줄 */
export const formatExcludeSummary = (excluded: readonly number[]): string =>
  excluded.length > 0
    ? `제외 번호(2회↑·직전): ${excluded.join(', ')} (${excluded.length}개)`
    : '제외 번호: 없음';
