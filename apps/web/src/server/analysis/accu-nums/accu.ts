import 'server-only';
import * as pg from '@/server/db/pg';
import { HttpError } from '@/server/http/error';
import * as WinQ from './queries/win.queries';

const NOT_FOUND = '선택한 회차의 당첨번호를 찾을 수 없습니다.';
const MIN_WINDOW = 1;
const MAX_WINDOW = 3000;

export async function drawNumbers(): Promise<number[]> {
  const rows = await pg.fetchAll(WinQ.LIST_DRAW_NOS);
  return rows.map((r) => Number(r.draw_no ?? Object.values(r)[0]));
}

export async function winningRange(
  drawNo: number,
): Promise<Record<string, unknown>[]> {
  if (drawNo <= 1) return [];
  return pg.fetchAll(WinQ.WIN_BEFORE_DRAW, [drawNo]);
}

export async function winningNumber(
  drawNo: number,
): Promise<Record<string, unknown>> {
  const row = await pg.fetchOne(WinQ.WIN_BY_DRAW, [drawNo]);
  if (!row) throw new HttpError(404, NOT_FOUND);
  return row;
}

export async function winningWindow(
  drawNo: number,
  windowSize: number,
): Promise<Record<string, unknown>[]> {
  if (drawNo <= 1) return [];
  const size = Math.min(MAX_WINDOW, Math.max(MIN_WINDOW, windowSize));
  return pg.fetchAll(WinQ.WIN_BEFORE_LIMIT, [drawNo, size]);
}
