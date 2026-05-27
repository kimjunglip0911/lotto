import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ChiSquareService } from './chi-square.service';

@Controller('analysis/chi-square')
export class ChiSquareController {
  constructor(private readonly svc: ChiSquareService) {}

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
