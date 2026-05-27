import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SnapshotGetDto, SnapshotSaveDto } from '../../domain/dto/snapshot.dto';
import { AnalysisDbUtil } from '../shared/analysis-db.util';
import { AccuNumsRepository } from './accu-nums.repository';
import * as Q from './accu-nums.queries';

const NOT_FOUND = '선택한 회차의 당첨번호를 찾을 수 없습니다.';
const SNAP_NOT_FOUND = '해당 회차에 저장된 분석 스냅샷이 없습니다.';
const MIN_WINDOW = 1;
const MAX_WINDOW = 3000;

@Injectable()
export class AccuNumsService {
  constructor(
    private readonly db: AnalysisDbUtil,
    private readonly repo: AccuNumsRepository,
  ) {}

  drawNumbers(): Promise<number[]> {
    return this.db.fetchDrawNumbers(Q.GET_AVAILABLE_DRAW_NOS);
  }

  winningRange(drawNo: number): Promise<Record<string, unknown>[]> {
    if (drawNo <= 1) {
      return Promise.resolve([]);
    }
    return this.db.fetchDictRows(Q.GET_WINNING_NUMBERS_BEFORE_DRAW, [drawNo]);
  }

  winningNumber(drawNo: number): Promise<Record<string, unknown>> {
    return this.db.fetchDictOr404(Q.GET_WINNING_NUMBERS_BY_DRAW, [drawNo], NOT_FOUND);
  }

  winningWindow(drawNo: number, windowSize: number): Promise<Record<string, unknown>[]> {
    if (drawNo <= 1) {
      return Promise.resolve([]);
    }
    const size = Math.min(MAX_WINDOW, Math.max(MIN_WINDOW, windowSize));
    return this.db.fetchDictRows(Q.GET_WINNING_NUMBERS_BEFORE_DRAW_LIMITED, [drawNo, size]);
  }

  async saveSnapshot(body: SnapshotSaveDto): Promise<void> {
    if (body.anchor_draw_no <= 1) {
      throw new HttpException(
        '회차 1은 이전 회차 집계가 없어 저장할 수 없습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }
    for (const n of body.final_numbers) {
      if (n < 1 || n > 45) {
        throw new HttpException('final_numbers must be in 1..45', HttpStatus.BAD_REQUEST);
      }
    }
    const [n1, n2, n3, n4] = body.final_numbers;
    await this.repo.saveSnapshot(body.anchor_draw_no, body.schema_version ?? 2, n1, n2, n3, n4);
  }

  async getSnapshot(drawNo: number): Promise<SnapshotGetDto> {
    const row = await this.repo.getSnapshotRow(drawNo);
    if (!row) {
      throw new HttpException(SNAP_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return {
      anchor_draw_no: Number(row.anchor_draw_no),
      schema_version: Number(row.schema_version),
      final_numbers: [
        Number(row.final_num1),
        Number(row.final_num2),
        Number(row.final_num3),
        Number(row.final_num4),
      ],
      updated_at: String(row.updated_at),
    };
  }
}
