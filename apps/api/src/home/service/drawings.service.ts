/**
 * 추첨 번호·당첨번호 관련 비즈니스 처리입니다.
 * DB에서 목록·회차·당첨번호를 읽고, 삭제·저장을 실행한 뒤 결과를 컨트롤러에 돌려줍니다.
 * SQL 문장은 queries 폴더의 draw·win 파일에만 두고, 여기서는 실행만 합니다.
 * 당첨번호가 없는 회차를 조회하면 "없음" 오류가 나가 화면에 안내가 표시됩니다.
 */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SqliteService } from '../../db/sqlite.service';
import { SaveWinningDto } from '../../domain/dto/winning.dto';
import * as DrawQ from '../queries/draw.queries';
import * as WinQ from '../queries/win.queries';

@Injectable()
export class DrawingsService {
  constructor(private readonly sqlite: SqliteService) {}

  async getDrawings(): Promise<Record<string, unknown>[]> {
    return this.sqlite.fetchAll(DrawQ.GET_ALL_DRAWINGS);
  }

  async deleteAll(): Promise<{ message: string }> {
    await this.sqlite.withDb((db) => {
      db.prepare(DrawQ.DELETE_ALL_DRAWINGS).run();
    });
    return { message: 'All drawings deleted successfully' };
  }

  async drawNumbers(): Promise<number[]> {
    const rows = await this.sqlite.fetchAll(DrawQ.GET_DISTINCT_DRAW_NOS);
    return rows.map((r) => Number(r.draw_no));
  }

  async getByNo(drawNo: number): Promise<Record<string, unknown>[]> {
    return this.sqlite.fetchAll(DrawQ.GET_DRAWINGS_BY_NO, [drawNo]);
  }

  async winningByNo(drawNo: number): Promise<Record<string, unknown>> {
    const row = await this.sqlite.fetchOne(WinQ.GET_WINNING_BY_NO, [drawNo]);
    if (!row) {
      throw new HttpException(
        `No winning numbers found for draw_no=${drawNo}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return row;
  }

  async saveWinning(req: SaveWinningDto): Promise<{ message: string }> {
    await this.sqlite.withDb((db) => {
      db.prepare(WinQ.UPSERT_WINNING).run(
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
}
