import 'server-only';
import type { PoolClient } from 'pg';
import { buildPositionBandDistribution } from '@/app/combination/logic/buildPositionBandDistribution';
import { toBandInserts } from '@/app/combination/logic/storedRows';
import * as pg from '@/server/db/pg';
import { listWinnersOn, replaceBandRows } from './band-repo';
import { toWinRow } from './toWinRow';

/** 현재 당첨 전체로 조합 집계를 덮어쓴다. */
export async function refreshOn(c: PoolClient): Promise<void> {
  const winners = (await listWinnersOn(c)).map(toWinRow);
  const dist = buildPositionBandDistribution(winners);
  await replaceBandRows(c, toBandInserts(dist.totalDraws, dist.rows));
}

export async function refreshComboStats(): Promise<void> {
  await pg.withTx((c) => refreshOn(c));
}
