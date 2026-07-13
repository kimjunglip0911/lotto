import { HttpError } from '@/server/http/error';

export type GenerateSetItem = {
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  method?: string;
  strategy?: string;
};

export type GenerateSave = {
  draw_no: number;
  applied_rule_ids?: string[];
  excluded_numbers?: number[];
  sets?: GenerateSetItem[];
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

function parseSet(raw: unknown): GenerateSetItem {
  if (!raw || typeof raw !== 'object') {
    throw new HttpError(400, 'set item invalid');
  }
  const s = raw as Record<string, unknown>;
  return {
    num1: asBall(s.num1, 'num1'),
    num2: asBall(s.num2, 'num2'),
    num3: asBall(s.num3, 'num3'),
    num4: asBall(s.num4, 'num4'),
    num5: asBall(s.num5, 'num5'),
    num6: asBall(s.num6, 'num6'),
    method: typeof s.method === 'string' ? s.method : undefined,
    strategy: typeof s.strategy === 'string' ? s.strategy : undefined,
  };
}

/** POST /api/recommend/generate-and-save body 검증 */
export function parseGenerateSave(body: unknown): GenerateSave {
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'body required');
  }
  const b = body as Record<string, unknown>;
  const out: GenerateSave = { draw_no: asInt(b.draw_no, 'draw_no') };
  if (Array.isArray(b.applied_rule_ids)) {
    out.applied_rule_ids = b.applied_rule_ids.map(String);
  }
  if (Array.isArray(b.excluded_numbers)) {
    out.excluded_numbers = b.excluded_numbers.map((n) => asInt(n, 'excluded'));
  }
  if (Array.isArray(b.sets)) out.sets = b.sets.map(parseSet);
  return out;
}
