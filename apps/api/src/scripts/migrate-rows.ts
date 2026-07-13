import { PoolClient } from 'pg';

export async function upsertWinners(
  c: PoolClient,
  rows: Record<string, unknown>[],
): Promise<void> {
  for (const w of rows) {
    await c.query(
      `INSERT INTO lotto_winners
        (draw_no,num1,num2,num3,num4,num5,num6,bonus_num,winner_count,winner_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (draw_no) DO UPDATE SET
         num1=EXCLUDED.num1,num2=EXCLUDED.num2,num3=EXCLUDED.num3,
         num4=EXCLUDED.num4,num5=EXCLUDED.num5,num6=EXCLUDED.num6,
         bonus_num=EXCLUDED.bonus_num,winner_count=EXCLUDED.winner_count,
         winner_amount=EXCLUDED.winner_amount`,
      [
        w.draw_no, w.num1, w.num2, w.num3, w.num4, w.num5, w.num6,
        w.bonus_num, w.winner_count ?? null, w.winner_amount ?? null,
      ],
    );
  }
}

export async function insertDrawings(
  c: PoolClient,
  rows: Record<string, unknown>[],
): Promise<void> {
  await c.query('DELETE FROM lotto_drawings');
  for (const d of rows) {
    await c.query(
      `INSERT INTO lotto_drawings
        (id,group_id,num1,num2,num3,num4,num5,num6,bonus_num,draw_count,method,draw_no,strategy)
       OVERRIDING SYSTEM VALUE
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        d.id, d.group_id, d.num1, d.num2, d.num3, d.num4, d.num5, d.num6,
        d.bonus_num, d.draw_count, d.method ?? null, d.draw_no ?? null,
        d.strategy ?? null,
      ],
    );
  }
}
