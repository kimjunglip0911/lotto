/**
 * 추첨 번호·당첨번호 관련 비즈니스 처리입니다.
 * SQL 문장은 queries 폴더의 draw·win 파일에만 두고, 여기서는 실행만 합니다.
 */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PgService } from '../../db/pg.service';
import { SaveWinningDto } from '../../domain/dto/winning.dto';
import * as DrawQ from '../queries/draw.queries';
import * as WinQ from '../queries/win.queries';

@Injectable()
export class DrawingsService {
  constructor(private readonly db: PgService) {}

  async getDrawings(): Promise<Record<string, unknown>[]> {
    return this.db.fetchAll(DrawQ.GET_ALL_DRAWINGS);
  }

  async deleteAll(): Promise<{ message: string }> {
    await this.db.run(DrawQ.DELETE_ALL_DRAWINGS);
    return { message: 'All drawings deleted successfully' };
  }

  async drawNumbers(): Promise<number[]> {
    const rows = await this.db.fetchAll(DrawQ.GET_DISTINCT_DRAW_NOS);
    return rows.map((r) => Number(r.draw_no));
  }

  async getByNo(drawNo: number): Promise<Record<string, unknown>[]> {
    return this.db.fetchAll(DrawQ.GET_DRAWINGS_BY_NO, [drawNo]);
  }

  async winningByNo(drawNo: number): Promise<Record<string, unknown>> {
    const row = await this.db.fetchOne(WinQ.GET_WINNING_BY_NO, [drawNo]);
    if (!row) {
      throw new HttpException(
        `No winning numbers found for draw_no=${drawNo}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return row;
  }

  async saveWinning(req: SaveWinningDto): Promise<{ message: string }> {
    await this.db.run(WinQ.UPSERT_WINNING, [
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
}
