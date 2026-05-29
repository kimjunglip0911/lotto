import { Injectable } from '@nestjs/common';
import { AnalysisDbUtil } from '../shared/analysis-db.util';
import * as Q from './trend.queries';

const NOT_FOUND = '선택한 회차의 당첨번호를 찾을 수 없습니다.';

@Injectable()
export class TrendService {
  constructor(private readonly db: AnalysisDbUtil) {}

  drawNumbers(): Promise<number[]> {
    return this.db.fetchDrawNumbers(Q.GET_AVAILABLE_DRAW_NOS);
  }

  winningNumber(drawNo: number): Promise<Record<string, unknown>> {
    return this.db.fetchDictOr404(
      Q.GET_WINNING_NUMBERS_BY_DRAW,
      [drawNo],
      NOT_FOUND,
    );
  }

  allHistory(drawNo: number): Promise<Record<string, unknown>[]> {
    if (drawNo <= 1) {
      return Promise.resolve([]);
    }
    return this.db.fetchDictRows(Q.GET_ALL_HISTORY_BEFORE_DRAW, [drawNo]);
  }
}
