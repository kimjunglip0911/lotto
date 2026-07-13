import { HttpError } from '@/server/http/error';

export type SaveWinning = {
  draw_no: number;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus_num: number;
};

function asInt(v: unknown, name: string): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isInteger(n)) throw new HttpError(400, `${name} must be int`);
  return n;
}

function asBall(v: unknown, name: string): number {
  const n = asInt(v, name);
  if (n < 1 || n > 45) throw new HttpError(400, `${name} must be 1..45`);
  return n;
}

/** POST /api/drawings/save-winning body 검증 */
export function parseSaveWinning(body: unknown): SaveWinning {
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'body required');
  }
  const b = body as Record<string, unknown>;
  return {
    draw_no: asInt(b.draw_no, 'draw_no'),
    num1: asBall(b.num1, 'num1'),
    num2: asBall(b.num2, 'num2'),
    num3: asBall(b.num3, 'num3'),
    num4: asBall(b.num4, 'num4'),
    num5: asBall(b.num5, 'num5'),
    num6: asBall(b.num6, 'num6'),
    bonus_num: asBall(b.bonus_num, 'bonus_num'),
  };
}
