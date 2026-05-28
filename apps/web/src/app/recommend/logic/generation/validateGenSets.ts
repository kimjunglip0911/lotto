/** 조합 생성 결과에 세트가 없으면 요약 문구와 함께 오류를 던진다 */

export const assertSetsNonEmpty = (
  sets: readonly unknown[],
  summaryLines: readonly string[],
): void => {
  if (sets.length === 0) {
    throw new Error(summaryLines.join(' ') || '세트를 생성하지 못했습니다.');
  }
};
