import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SqliteService } from '../db/sqlite.service';
import { SaveWinningDto } from '../domain/dto/winning.dto';
import * as Q from './home.queries';

@Injectable()
export class HomeService {
  constructor(private readonly sqlite: SqliteService) {}

  async getDrawings(): Promise<Record<string, unknown>[]> {
    return this.sqlite.fetchAll(Q.GET_ALL_DRAWINGS);
  }

  async deleteAll(): Promise<{ message: string }> {
    await this.sqlite.withDb((db) => {
      db.prepare(Q.DELETE_ALL_DRAWINGS).run();
    });
    return { message: 'All drawings deleted successfully' };
  }

  async drawNumbers(): Promise<number[]> {
    const rows = await this.sqlite.fetchAll(Q.GET_DISTINCT_DRAW_NOS);
    return rows.map((r) => Number(r.draw_no));
  }

  async recommendDrawings(drawNo?: number): Promise<Record<string, unknown>[]> {
    let target = drawNo;
    if (target == null) {
      const latest = await this.sqlite.fetchOne(Q.GET_MAX_DRAW_NO);
      const maxVal = latest ? Object.values(latest)[0] : null;
      target = maxVal != null ? Number(maxVal) : undefined;
    }
    if (target == null) {
      return [];
    }
    const rows = await this.sqlite.fetchAll(Q.GET_DRAWINGS_BY_NO, [target]);
    return this.buildRecommendedDrawings(rows);
  }

  async getByNo(drawNo: number): Promise<Record<string, unknown>[]> {
    return this.sqlite.fetchAll(Q.GET_DRAWINGS_BY_NO, [drawNo]);
  }

  async winningByNo(drawNo: number): Promise<Record<string, unknown>> {
    const row = await this.sqlite.fetchOne(Q.GET_WINNING_BY_NO, [drawNo]);
    if (!row) {
      throw new HttpException(`No winning numbers found for draw_no=${drawNo}`, HttpStatus.NOT_FOUND);
    }
    return row;
  }

  async saveWinning(req: SaveWinningDto): Promise<{ message: string }> {
    await this.sqlite.withDb((db) => {
      db.prepare(Q.UPSERT_WINNING).run(
        req.draw_no,
        req.num1,
        req.num2,
        req.num3,
        req.num4,
        req.num5,
        req.num6,
        req.bonus_num,
      );
    });
    return { message: `${req.draw_no}회 당첨번호가 저장되었습니다.` };
  }

  private buildRecommendedDrawings(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    if (!rows.length) {
      return [];
    }
    const normalize = (method: unknown): string => {
      const s = method == null ? '기본' : String(method);
      return s.replace(' (Fallback)', '');
    };
    const byMethod = new Map<string, Record<string, unknown>[]>();
    for (const row of rows) {
      const method = normalize(row.method);
      if (!byMethod.has(method)) {
        byMethod.set(method, []);
      }
      byMethod.get(method)!.push(row);
    }
    for (const list of byMethod.values()) {
      this.shuffle(list);
    }
    const recommended: Record<string, unknown>[] = [];
    for (const method of [...byMethod.keys()]) {
      const list = byMethod.get(method)!;
      if (list.length) {
        recommended.push(list.pop()!);
      }
    }
    const pool: Record<string, unknown>[] = [];
    for (const list of byMethod.values()) {
      pool.push(...list);
    }
    if (pool.length && recommended.length < 10) {
      const sampleSize = Math.min(pool.length, 10 - recommended.length);
      recommended.push(...this.sample(pool, sampleSize));
    }
    return recommended;
  }

  private shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  private sample<T>(arr: T[], n: number): T[] {
    const copy = [...arr];
    this.shuffle(copy);
    return copy.slice(0, n);
  }
}
