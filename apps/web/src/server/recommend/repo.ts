import 'server-only';
import * as pg from '@/server/db/pg';
import * as Q from './recommend.queries';
import { replaceMethodRows } from './replace-rows';
import { WINDOW_SIZES } from './window-sizes';

export async function resolveTargetDrawNo(drawNo?: number): Promise<number> {
  if (drawNo != null) return drawNo;
  const latest = await pg.fetchOne(Q.GET_MAX_WINNER_DRAW_NO);
  const maxVal = latest?.max_draw_no;
  if (maxVal == null) return 1;
  return Number(maxVal) + 1;
}

async function fetchWinningRows(
  drawNo: number,
  windowSize: number | null,
): Promise<Record<string, unknown>[]> {
  if (drawNo <= 1) return [];
  if (windowSize == null) {
    return pg.fetchAll(Q.GET_WINNING_NUMBERS_BEFORE_DRAW, [drawNo]);
  }
  return pg.fetchAll(Q.GET_WINNING_NUMBERS_BEFORE_DRAW_LIMITED, [
    drawNo,
    windowSize,
  ]);
}

export async function fetchRowsByWindow(
  drawNo: number,
): Promise<Record<string, Record<string, unknown>[]>> {
  const out: Record<string, Record<string, unknown>[]> = {};
  for (const [name, size] of Object.entries(WINDOW_SIZES)) {
    out[name] = await fetchWinningRows(drawNo, size);
  }
  return out;
}

export async function replaceDrawingsForMethod(
  drawNo: number,
  method: string,
  rows: Record<string, unknown>[],
  idFactory: () => string,
): Promise<void> {
  await pg.withTx((c) =>
    replaceMethodRows(c, drawNo, method, rows, idFactory),
  );
}

export async function getDrawingsByMethod(
  drawNo: number,
  method: string,
): Promise<Record<string, unknown>[]> {
  return pg.fetchAll(Q.GET_DRAWINGS_BY_DRAW_NO_AND_METHOD, [drawNo, method]);
}
