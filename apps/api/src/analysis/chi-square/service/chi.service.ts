/**
 * 카이제곱 검정 분석용 당첨·회차 데이터를 읽어 옵니다.
 * 회차 목록, 특정 회차 당첨번호, 선택 회차 이전 당첨 이력을 처리합니다.
 * 조회 문장은 queries/win.queries.ts에만 두고, 여기서는 범위·없는 회차만 판단합니다.
 * 없는 회차는 "당첨번호를 찾을 수 없습니다" 안내가 화면·연동 화면에 전달됩니다.
 */
import { Injectable } from '@nestjs/common';
import { AnalysisDbUtil } from '../../shared/analysis-db.util';
import * as WinQ from '../queries/win.queries';

const NOT_FOUND = '선택한 회차의 당첨번호를 찾을 수 없습니다.';

@Injectable()
export class ChiService {
  constructor(private readonly db: AnalysisDbUtil) {}

  drawNumbers(): Promise<number[]> {
    return this.db.fetchDrawNumbers(WinQ.LIST_DRAW_NOS);
  }

  winningNumber(drawNo: number): Promise<Record<string, unknown>> {
    return this.db.fetchDictOr404(WinQ.WIN_BY_DRAW, [drawNo], NOT_FOUND);
  }

  winningRange(drawNo: number): Promise<Record<string, unknown>[]> {
    if (drawNo <= 1) {
      return Promise.resolve([]);
    }
    return this.db.fetchDictRows(WinQ.WIN_BEFORE_DRAW, [drawNo]);
  }
}
