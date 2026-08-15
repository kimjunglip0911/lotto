import 'server-only';
import * as pg from '@/server/db/pg';
import type { SaveWinning } from '@/server/validate/winning';
import { refreshOn } from '@/server/analysis/combination/refresh';
import * as WinQ from './queries/win.queries';

/** 당첨 upsert와 조합 집계 갱신을 한 트랜잭션으로 묶는다. */
export async function saveWinning(
  req: SaveWinning,
): Promise<{ message: string }> {
  await pg.withTx(async (c) => {
    await c.query(WinQ.UPSERT_WINNING, [
      req.draw_no,
      req.num1,
      req.num2,
      req.num3,
      req.num4,
      req.num5,
      req.num6,
      req.bonus_num,
    ]);
    await refreshOn(c);
  });
  return { message: `${req.draw_no}회 당첨번호가 저장되었습니다.` };
}
