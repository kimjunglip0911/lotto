/** 연속 구간·정렬 유틸 */

export const maxConsecutiveRunLength = (sorted: readonly number[]): number => {
  let maxRun = 1;
  let current = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] === sorted[i]! + 1) {
      current++;
    } else {
      if (current > maxRun) maxRun = current;
      current = 1;
    }
  }
  if (current > maxRun) maxRun = current;
  return maxRun;
};

export const sortPickedAsc = (nums: readonly number[]): number[] =>
  [...nums].sort((a, b) => a - b);
