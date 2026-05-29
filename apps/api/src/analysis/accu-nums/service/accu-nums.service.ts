/**
 * 누적 번호 분석용 당첨·회차 데이터를 읽어 옵니다.
 * 회차 목록, 특정 회차 당첨번호, 이전 회차 묶음·창 크기 조회를 처리합니다.
 * SQL은 queries/win.queries.ts에만 두고, 여기서는 조건·범위만 정합니다.
 * 없는 회차는 "당첨번호를 찾을 수 없습니다" 안내가 화면에 전달됩니다.
 */
import { Injectable } from '@nestjs/common';
import { AnalysisDbUtil } from '../../shared/analysis-db.util';
import * as WinQ from '../queries/win.queries';

const NOT_FOUND = '선택한 회차의 당첨번호를 찾을 수 없습니다.';
const MIN_WINDOW = 1;
const MAX_WINDOW = 3000;

@Injectable()
export class AccuNumsService {
  constructor(private readonly db: AnalysisDbUtil) {}

  drawNumbers(): Promise<number[]> {
    return this.db.fetchDrawNumbers(WinQ.LIST_DRAW_NOS);
  }

  winningRange(drawNo: number): Promise<Record<string, unknown>[]> {
    if (drawNo <= 1) {
      return Promise.resolve([]);
    }
    return this.db.fetchDictRows(WinQ.WIN_BEFORE_DRAW, [drawNo]);
  }

  winningNumber(drawNo: number): Promise<Record<string, unknown>> {
    return this.db.fetchDictOr404(WinQ.WIN_BY_DRAW, [drawNo], NOT_FOUND);
  }

  winningWindow(
    drawNo: number,
    windowSize: number,
  ): Promise<Record<string, unknown>[]> {
    if (drawNo <= 1) {
      return Promise.resolve([]);
    }
    const size = Math.min(MAX_WINDOW, Math.max(MIN_WINDOW, windowSize));
    return this.db.fetchDictRows(WinQ.WIN_BEFORE_LIMIT, [drawNo, size]);
  }
}
