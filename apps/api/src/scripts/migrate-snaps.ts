import { PoolClient } from 'pg';

export async function upsertSnaps(
  c: PoolClient,
  rows: Record<string, unknown>[],
): Promise<void> {
  for (const s of rows) {
    await c.query(
      `INSERT INTO accumulated_number_snapshots
        (anchor_draw_no,schema_version,final_num1,final_num2,final_num3,final_num4,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7::timestamptz,NOW()))
       ON CONFLICT (anchor_draw_no) DO UPDATE SET
         schema_version=EXCLUDED.schema_version,
         final_num1=EXCLUDED.final_num1,final_num2=EXCLUDED.final_num2,
         final_num3=EXCLUDED.final_num3,final_num4=EXCLUDED.final_num4,
         updated_at=EXCLUDED.updated_at`,
      [
        s.anchor_draw_no, s.schema_version, s.final_num1, s.final_num2,
        s.final_num3, s.final_num4, s.updated_at ?? null,
      ],
    );
  }
}
