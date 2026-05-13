/** 최종 4개 조합이 “너무 치우치지 않았는지” 자리대·홀짝·연속으로 검사한다. */

export function bandIndex(n: number): number {
  if (n <= 15) return 0;
  if (n <= 30) return 1;
  return 2;
}

export function hasValidHardConstraints(nums: number[]): boolean {
  if (nums.length !== 4) return false;
  const sorted = [...nums].sort((a, b) => a - b);
  const odd = sorted.filter((n) => n % 2 === 1).length;
  const even = 4 - odd;
  if (odd === 0 || even === 0) return false;

  let consecutivePairs = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] - sorted[i - 1] === 1) consecutivePairs += 1;
  }
  if (consecutivePairs > 1) return false;

  const endDigitCounts = new Map<number, number>();
  const bandCounts = [0, 0, 0];
  for (const n of sorted) {
    const digit = n % 10;
    endDigitCounts.set(digit, (endDigitCounts.get(digit) ?? 0) + 1);
    if ((endDigitCounts.get(digit) ?? 0) > 1) return false;

    const b = bandIndex(n);
    bandCounts[b] += 1;
    if (bandCounts[b] > 2) return false;
  }
  return true;
}
