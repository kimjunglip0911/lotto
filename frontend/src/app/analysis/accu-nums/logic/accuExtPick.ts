/** 누적 출현 횟수 배열에서 최다·최소 번호 하나를 고른다. */

export const pickHighestCountNumber = (counts: readonly number[]): number | null => {
  if (counts.length === 0) return null;
  let bestNum = 1;
  let bestCount = counts[0] ?? 0;
  for (let i = 1; i < counts.length; i += 1) {
    const n = i + 1;
    const c = counts[i] ?? 0;
    if (c > bestCount || (c === bestCount && n < bestNum)) {
      bestNum = n;
      bestCount = c;
    }
  }
  return bestNum;
};

export const pickLowestCountNumber = (counts: readonly number[]): number | null => {
  if (counts.length === 0) return null;
  let bestNum = 1;
  let bestCount = counts[0] ?? 0;
  for (let i = 1; i < counts.length; i += 1) {
    const n = i + 1;
    const c = counts[i] ?? 0;
    if (c < bestCount || (c === bestCount && n < bestNum)) {
      bestNum = n;
      bestCount = c;
    }
  }
  return bestNum;
};
