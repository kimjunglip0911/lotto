import { Injectable } from '@nestjs/common';
import { PgService } from '../db/pg.service';
import * as Q from './recommend.queries';
import { replaceMethodRows } from './replace-rows';
import { WINDOW_SIZES } from './window-sizes';

@Injectable()
export class RecommendRepository {
  constructor(private readonly db: PgService) {}

  async resolveTargetDrawNo(drawNo?: number): Promise<number> {
    if (drawNo != null) return drawNo;
    const latest = await this.db.fetchOne(Q.GET_MAX_WINNER_DRAW_NO);
    const maxVal = latest?.max_draw_no;
    if (maxVal == null) return 1;
    return Number(maxVal) + 1;
  }

  async fetchWinningRows(
    drawNo: number,
    windowSize: number | null,
  ): Promise<Record<string, unknown>[]> {
    if (drawNo <= 1) return [];
    if (windowSize == null) {
      return this.db.fetchAll(Q.GET_WINNING_NUMBERS_BEFORE_DRAW, [drawNo]);
    }
    return this.db.fetchAll(Q.GET_WINNING_NUMBERS_BEFORE_DRAW_LIMITED, [
      drawNo,
      windowSize,
    ]);
  }

  async fetchRowsByWindow(
    drawNo: number,
  ): Promise<Record<string, Record<string, unknown>[]>> {
    const out: Record<string, Record<string, unknown>[]> = {};
    for (const [name, size] of Object.entries(WINDOW_SIZES)) {
      out[name] = await this.fetchWinningRows(drawNo, size);
    }
    return out;
  }

  async replaceDrawingsForMethod(
    drawNo: number,
    method: string,
    rows: Record<string, unknown>[],
    idFactory: () => string,
  ): Promise<void> {
    await this.db.withTx((c) =>
      replaceMethodRows(c, drawNo, method, rows, idFactory),
    );
  }

  async getDrawingsByDrawNoAndMethod(
    drawNo: number,
    method: string,
  ): Promise<Record<string, unknown>[]> {
    return this.db.fetchAll(Q.GET_DRAWINGS_BY_DRAW_NO_AND_METHOD, [
      drawNo,
      method,
    ]);
  }
}
