/**
 * /api/analysis/chi-square 주소로 들어오는 요청의 진입점입니다.
 * 회차 목록, 회차별 당첨번호, 선택 회차 이전 당첨 이력 조회를 service에 넘깁니다.
 * combination·recommend 화면도 같은 주소를 쓰므로 경로를 바꾸지 않습니다.
 */
import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ChiService } from '../service/chi.service';

@Controller('analysis/chi-square')
export class ChiController {
  constructor(private readonly svc: ChiService) {}

  @Get('draw-numbers')
  drawNumbers(): Promise<number[]> {
    return this.svc.drawNumbers();
  }

  @Get('winning-number')
  winningNumber(
    @Query('draw_no', ParseIntPipe) drawNo: number,
  ): Promise<Record<string, unknown>> {
    return this.svc.winningNumber(drawNo);
  }

  @Get('winning-numbers-range')
  winningRange(
    @Query('draw_no', ParseIntPipe) drawNo: number,
  ): Promise<Record<string, unknown>[]> {
    return this.svc.winningRange(drawNo);
  }
}
