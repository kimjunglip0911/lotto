export function generateWheelSets(
  count = 20,
  _startIndex = 0,
  _drawNo?: number,
): Record<string, number>[] {
  const rows: Record<string, number>[] = [];
  const n = Math.max(1, count);
  for (let i = 0; i < n; i++) {
    const numbers = sampleSorted(45, 6);
    rows.push({
      num1: numbers[0],
      num2: numbers[1],
      num3: numbers[2],
      num4: numbers[3],
      num5: numbers[4],
      num6: numbers[5],
    });
  }
  return rows;
}

export function generateJlWheelSets(
  _drawNo: number,
  count = 20,
  startIndex = 0,
): Record<string, number>[] {
  return generateWheelSets(count, startIndex);
}

export function analyzeDrawDuplicateSets(drawNo: number, count = 20): Record<string, unknown> {
  const rows = generateWheelSets(count, 0, drawNo);
  const signatureCounts = new Map<string, number>();
  for (const row of rows) {
    const sig = [1, 2, 3, 4, 5, 6].map((i) => row[`num${i}`]).join(',');
    signatureCounts.set(sig, (signatureCounts.get(sig) ?? 0) + 1);
  }
  let duplicateSetCount = 0;
  for (const freq of signatureCounts.values()) {
    if (freq > 1) {
      duplicateSetCount += 1;
    }
  }
  return {
    drawNo,
    count,
    duplicateSetCount,
    uniqueSetCount: signatureCounts.size,
    mode: 'fallback-random',
  };
}

function sampleSorted(max: number, k: number): number[] {
  const pool = Array.from({ length: max }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, k).sort((a, b) => a - b);
}
