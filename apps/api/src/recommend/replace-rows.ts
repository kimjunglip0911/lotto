import { PoolClient } from 'pg';
import * as Q from './recommend.queries';

/** 회차·method 단위로 drawings를 지우고 다시 넣습니다. */
export async function replaceMethodRows(
  c: PoolClient,
  drawNo: number,
  method: string,
  rows: Record<string, unknown>[],
  idFactory: () => string,
): Promise<void> {
  await c.query(Q.DELETE_DRAWINGS_BY_NO_AND_METHOD, [drawNo, method]);
  for (const row of rows) {
    await c.query(Q.INSERT_DRAWING, [
      idFactory(),
      Number(row.num1),
      Number(row.num2),
      Number(row.num3),
      Number(row.num4),
      Number(row.num5),
      Number(row.num6),
      0,
      0,
      method,
      drawNo,
      row.strategy ?? null,
    ]);
  }
}
