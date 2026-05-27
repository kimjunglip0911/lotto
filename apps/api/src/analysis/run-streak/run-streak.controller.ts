import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { RunStreakService } from './run-streak.service';

@Controller('analysis/run-streak')
export class RunStreakController {
  constructor(private readonly svc: RunStreakService) {}

  @Get('draw-numbers')
  drawNumbers(): Promise<number[]> {
    return this.svc.drawNumbers();
  }

  @Get('winning-number')
  winningNumber(@Query('draw_no', ParseIntPipe) drawNo: number): Promise<Record<string, unknown>> {
    return this.svc.winningNumber(drawNo);
  }

  @Get('winning-numbers-range')
  winningRange(@Query('draw_no', ParseIntPipe) drawNo: number): Promise<Record<string, unknown>[]> {
    return this.svc.winningRange(drawNo);
  }
}
