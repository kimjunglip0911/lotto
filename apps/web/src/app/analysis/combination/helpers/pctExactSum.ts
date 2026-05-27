/** 소수 둘째 자리까지 내린 뒤 잔여를 최대 잔차법으로 배분해 합계 100.00 */
export function percentagesWithExactHundredSum(
  counts: readonly number[],
  totalDraws: number,
): number[] {
  if (totalDraws === 0) return counts.map(() => 0);
  const exact = counts.map((c) => (c / totalDraws) * 100);
  const floored = exact.map((e) => Math.floor(e * 100 + 1e-9) / 100);
  const sumFloored = floored.reduce((a, b) => a + b, 0);
  let remainderHundredths = Math.round((100 - sumFloored) * 100);
  if (remainderHundredths < 0) remainderHundredths = 0;

  const order = exact
    .map((e, i) => ({
      i,
      frac: e * 100 - Math.floor(e * 100 + 1e-9),
    }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floored];
  for (let k = 0; k < remainderHundredths && k < order.length; k++) {
    result[order[k].i] += 0.01;
  }
  return result;
}
