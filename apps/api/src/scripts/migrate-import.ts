import { Pool } from 'pg';
import { insertDrawings, upsertWinners } from './migrate-rows';
import { upsertSnaps } from './migrate-snaps';

type Dump = {
  winners: Record<string, unknown>[];
  drawings: Record<string, unknown>[];
  snaps: Record<string, unknown>[];
};

/** dump JSON을 Postgres에 반영하고 row count를 출력합니다. */
export async function importDump(pool: Pool, dump: Dump): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await upsertWinners(client, dump.winners);
    await insertDrawings(client, dump.drawings);
    await upsertSnaps(client, dump.snaps);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  const counts = await pool.query(`
    SELECT 'lotto_winners' AS t, COUNT(*)::int AS c FROM lotto_winners
    UNION ALL SELECT 'lotto_drawings', COUNT(*)::int FROM lotto_drawings
    UNION ALL SELECT 'accumulated_number_snapshots', COUNT(*)::int
      FROM accumulated_number_snapshots`);
  console.log('dump →', {
    winners: dump.winners.length,
    drawings: dump.drawings.length,
    snaps: dump.snaps.length,
  });
  console.log('Postgres →', counts.rows);
}
