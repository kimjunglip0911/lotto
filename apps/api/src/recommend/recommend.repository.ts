import { Injectable } from '@nestjs/common';
import { SqliteService } from '../db/sqlite.service';
import * as Q from './recommend.queries';

export const WINDOW_SIZES: Record<string, number | null> = {
  overall: null,
  sixMonth: 26,
  oneYear: 52,
  threeYear: 156,
  fiveYear: 260,
  tenYear: 520,
};

@Injectable()
export class RecommendRepository {
  constructor(private readonly sqlite: SqliteService) {}

  async resolveTargetDrawNo(drawNo?: number): Promise<number> {
    if (drawNo != null) {
      return drawNo;
    }
    const latest = await this.sqlite.fetchOne(Q.GET_MAX_WINNER_DRAW_NO);
    const maxVal = latest ? Object.values(latest)[0] : null;
    if (maxVal == null) {
      return 1;
    }
    return Number(maxVal) + 1;
  }

  async fetchWinningRows(drawNo: number, windowSize: number | null): Promise<Record<string, unknown>[]> {
    if (drawNo <= 1) {
      return [];
    }
    if (windowSize == null) {
      return this.sqlite.fetchAll(Q.GET_WINNING_NUMBERS_BEFORE_DRAW, [drawNo]);
    }
    return this.sqlite.fetchAll(Q.GET_WINNING_NUMBERS_BEFORE_DRAW_LIMITED, [drawNo, windowSize]);
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
    await this.sqlite.withDb((db) => {
      db.prepare(Q.DELETE_DRAWINGS_BY_NO_AND_METHOD).run(drawNo, method);
      const insert = db.prepare(Q.INSERT_DRAWING);
      for (const row of rows) {
        insert.run(
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
        );
      }
    });
  }

  async getDrawingsByDrawNoAndMethod(drawNo: number, method: string): Promise<Record<string, unknown>[]> {
    return this.sqlite.fetchAll(Q.GET_DRAWINGS_BY_DRAW_NO_AND_METHOD, [drawNo, method]);
  }
}
