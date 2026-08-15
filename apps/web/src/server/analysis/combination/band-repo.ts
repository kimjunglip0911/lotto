import 'server-only';
import type { PoolClient } from 'pg';
import * as pg from '@/server/db/pg';
import type { ComboBandInsert } from '@/app/combination/logic/storedRows';
import * as BandQ from './queries/band.queries';
import * as WinQ from './queries/win.queries';

export async function listWinnersOn(
  c: PoolClient,
): Promise<Record<string, unknown>[]> {
  const res = await c.query(WinQ.LIST_ALL_WINNERS);
  return res.rows as Record<string, unknown>[];
}

export async function listBandRows(): Promise<Record<string, unknown>[]> {
  return pg.fetchAll(BandQ.SELECT_ALL_BANDS);
}

export async function replaceBandRows(
  c: PoolClient,
  inserts: readonly ComboBandInsert[],
): Promise<void> {
  await c.query(BandQ.DELETE_ALL_BANDS);
  for (const row of inserts) {
    await c.query(BandQ.INSERT_BAND, [
      row.position,
      row.bandLabel,
      row.drawCount,
      row.percentage,
      row.totalDraws,
    ]);
  }
}
