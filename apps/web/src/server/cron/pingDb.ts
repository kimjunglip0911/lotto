import 'server-only';
import { fetchOne } from '@/server/db/pg';

/** Supabase 휴면 방지용 가벼운 DB 조회 */

export type PingDbResult = {
  ok: boolean;
  at: string;
  drawCount: number | null;
};

export const pingDb = async (): Promise<PingDbResult> => {
  const row = await fetchOne(
    'SELECT COUNT(*)::int AS cnt FROM lotto_winners',
  );
  const drawCount =
    typeof row?.cnt === 'number' ? row.cnt : Number(row?.cnt ?? NaN);
  return {
    ok: Number.isFinite(drawCount),
    at: new Date().toISOString(),
    drawCount: Number.isFinite(drawCount) ? drawCount : null,
  };
};
