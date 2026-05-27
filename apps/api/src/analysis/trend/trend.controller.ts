import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { TrendService } from './trend.service';

@Controller('analysis/trend')
export class TrendController {
  constructor(private readonly svc: TrendService) {}

  @Get('draw-numbers')
  drawNumbers(): Promise<number[]> {
    return this.svc.drawNumbers();
  }

  @Get('winning-number')
  winningNumber(@Query('draw_no', ParseIntPipe) drawNo: number): Promise<Record<string, unknown>> {
    return this.svc.winningNumber(drawNo);
  }

  @Get('all-history')
  allHistory(@Query('draw_no', ParseIntPipe) drawNo: number): Promise<Record<string, unknown>[]> {
    return this.svc.allHistory(drawNo);
  }
}
