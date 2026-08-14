/** 1번대(1~9) · 10번대(10~19) · 20 · 30 · 40번대(40~45) */

export const DECADE_KEYS = [1, 10, 20, 30, 40] as const;
export type DecadeKey = (typeof DECADE_KEYS)[number];
export type DecadeQuota = Record<DecadeKey, number>;

export const decadeOf = (n: number): DecadeKey => {
  if (n < 10) return 1;
  if (n < 20) return 10;
  if (n < 30) return 20;
  if (n < 40) return 30;
  return 40;
};

/** RANK6~10 번호대 칸 */

const QUOTA: Record<number, readonly [number, number, number, number, number]> = {
  6: [1, 1, 2, 1, 1],
  7: [1, 1, 1, 2, 1],
  8: [1, 2, 2, 1, 0],
  9: [0, 2, 2, 2, 0],
  10: [1, 0, 3, 1, 1],
};

export const decadeQuota = (setRank: number): DecadeQuota | null => {
  const row = QUOTA[setRank];
  if (!row) return null;
  return { 1: row[0]!, 10: row[1]!, 20: row[2]!, 30: row[3]!, 40: row[4]! };
};
