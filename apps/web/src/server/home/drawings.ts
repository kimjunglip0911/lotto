import 'server-only';
import * as pg from '@/server/db/pg';
import { HttpError } from '@/server/http/error';
import type { SaveWinning } from '@/server/validate/winning';
import * as DrawQ from './queries/draw.queries';
import * as WinQ from './queries/win.queries';

export async function getDrawings(): Promise<Record<string, unknown>[]> {
  return pg.fetchAll(DrawQ.GET_ALL_DRAWINGS);
}

export async function deleteAll(): Promise<{ message: string }> {
  await pg.run(DrawQ.DELETE_ALL_DRAWINGS);
  return { message: 'All drawings deleted successfully' };
}

export async function drawNumbers(): Promise<number[]> {
  const rows = await pg.fetchAll(DrawQ.GET_DISTINCT_DRAW_NOS);
  return rows.map((r) => Number(r.draw_no));
}

export async function getByNo(
  drawNo: number,
): Promise<Record<string, unknown>[]> {
  return pg.fetchAll(DrawQ.GET_DRAWINGS_BY_NO, [drawNo]);
}

export async function winningByNo(
  drawNo: number,
): Promise<Record<string, unknown>> {
  const row = await pg.fetchOne(WinQ.GET_WINNING_BY_NO, [drawNo]);
  if (!row) {
    throw new HttpError(
      404,
      `No winning numbers found for draw_no=${drawNo}`,
    );
  }
  return row;
}

export async function saveWinning(
  req: SaveWinning,
): Promise<{ message: string }> {
  await pg.run(WinQ.UPSERT_WINNING, [
    req.draw_no,
    req.num1,
    req.num2,
    req.num3,
    req.num4,
    req.num5,
    req.num6,
    req.bonus_num,
  ]);
  return { message: `${req.draw_no}회 당첨번호가 저장되었습니다.` };
}
