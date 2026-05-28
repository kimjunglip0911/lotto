/** 채택 풀에 없는 1~45 번호를 제외 목록으로 만든다 */

export const buildExcludedNumbers = (adopted: readonly number[]): number[] =>
  Array.from({ length: 45 }, (_, i) => i + 1).filter((n) => !adopted.includes(n));
