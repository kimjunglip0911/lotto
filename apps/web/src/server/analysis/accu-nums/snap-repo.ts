import 'server-only';
import * as pg from '@/server/db/pg';
import * as SnapQ from './queries/snap.queries';

export async function saveSnapshotRow(
  anchorDrawNo: number,
  schemaVersion: number,
  n1: number,
  n2: number,
  n3: number,
  n4: number,
): Promise<void> {
  await pg.run(SnapQ.UPSERT_SNAP, [
    anchorDrawNo,
    schemaVersion,
    n1,
    n2,
    n3,
    n4,
  ]);
}

export async function getSnapshotRow(
  anchorDrawNo: number,
): Promise<Record<string, unknown> | null> {
  const row = await pg.fetchOne(SnapQ.SNAP_BY_DRAW, [anchorDrawNo]);
  return row ?? null;
}
