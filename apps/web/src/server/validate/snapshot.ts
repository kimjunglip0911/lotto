import { HttpError } from '@/server/http/error';

export type SnapshotSave = {
  anchor_draw_no: number;
  schema_version: number;
  final_numbers: number[];
};

function asInt(v: unknown, name: string): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isInteger(n)) throw new HttpError(400, `${name} must be int`);
  return n;
}

/** POST snapshot body 검증 */
export function parseSnapshotSave(body: unknown): SnapshotSave {
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'body required');
  }
  const b = body as Record<string, unknown>;
  const anchor = asInt(b.anchor_draw_no, 'anchor_draw_no');
  if (anchor < 1) throw new HttpError(400, 'anchor_draw_no min 1');
  const schema =
    b.schema_version == null ? 2 : asInt(b.schema_version, 'schema_version');
  if (!Array.isArray(b.final_numbers) || b.final_numbers.length !== 4) {
    throw new HttpError(400, 'final_numbers must have 4 items');
  }
  const finals = b.final_numbers.map((n, i) => asInt(n, `final[${i}]`));
  return { anchor_draw_no: anchor, schema_version: schema, final_numbers: finals };
}
