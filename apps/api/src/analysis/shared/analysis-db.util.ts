import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SqliteService } from '../../db/sqlite.service';

@Injectable()
export class AnalysisDbUtil {
  constructor(private readonly sqlite: SqliteService) {}

  async fetchDrawNumbers(sql: string, params: unknown[] = []): Promise<number[]> {
    const rows = await this.sqlite.fetchAll(sql, params);
    return rows.map((r) => Number(r.draw_no ?? Object.values(r)[0]));
  }

  async fetchDictOr404(
    sql: string,
    params: unknown[],
    notFoundDetail: string,
  ): Promise<Record<string, unknown>> {
    const row = await this.sqlite.fetchOne(sql, params);
    if (!row) {
      throw new HttpException(notFoundDetail, HttpStatus.NOT_FOUND);
    }
    return row;
  }

  async fetchDictRows(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
    return this.sqlite.fetchAll(sql, params);
  }
}
