const NUMBER_KEYS = [
  'num1',
  'num2',
  'num3',
  'num4',
  'num5',
  'num6',
  'bonus_num',
] as const;

export type NumPick = {
  number: number;
  count: number;
  is_tie: boolean;
  candidates: number[];
};

export function buildNumberCounts(rows: Record<string, unknown>[]): number[] {
  const counts = new Array<number>(45).fill(0);
  for (const row of rows) {
    for (const key of NUMBER_KEYS) {
      const value = row[key];
      if (typeof value === 'number' && value >= 1 && value <= 45) {
        counts[value - 1] += 1;
      }
    }
  }
  return counts;
}

function pickByCount(counts: number[], pickMax: boolean): NumPick {
  if (counts.length !== 45) {
    throw new Error('counts length must be 45');
  }
  const target = pickMax ? Math.max(...counts) : Math.min(...counts);
  const candidates: number[] = [];
  counts.forEach((c, i) => {
    if (c === target) {
      candidates.push(i + 1);
    }
  });
  if (!candidates.length) {
    throw new Error('no candidate number found');
  }
  return {
    number: candidates[0],
    count: target,
    is_tie: candidates.length > 1,
    candidates,
  };
}

export function pickTopNumber(counts: number[]): NumPick {
  return pickByCount(counts, true);
}

export function pickLeastFrequentNumber(counts: number[]): NumPick {
  return pickByCount(counts, false);
}

export function replaceExcludedInRows(
  rows: Record<string, unknown>[],
  excludedSet: Set<number>,
): Record<string, unknown>[] {
  if (!excludedSet.size) {
    return rows;
  }
  const pool = Array.from({ length: 45 }, (_, i) => i + 1).filter(
    (n) => !excludedSet.has(n),
  );
  if (pool.length < 6) {
    return rows;
  }
  const result: Record<string, unknown>[] = [];
  for (const row of rows) {
    const nums = new Set([
      Number(row.num1),
      Number(row.num2),
      Number(row.num3),
      Number(row.num4),
      Number(row.num5),
      Number(row.num6),
    ]);
    let hit = false;
    for (const n of nums) {
      if (excludedSet.has(n)) {
        hit = true;
        break;
      }
    }
    if (hit) {
      const picked = sampleSorted(pool, 6);
      result.push({
        num1: picked[0],
        num2: picked[1],
        num3: picked[2],
        num4: picked[3],
        num5: picked[4],
        num6: picked[5],
      });
    } else {
      result.push(row);
    }
  }
  return result;
}

function sampleSorted(pool: number[], k: number): number[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, k).sort((a, b) => a - b);
}
