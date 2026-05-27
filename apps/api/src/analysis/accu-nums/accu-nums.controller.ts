import { Body, Controller, Get, ParseIntPipe, Post, Query } from '@nestjs/common';
import { MessageResponseDto } from '../../domain/dto/message.dto';
import { SnapshotSaveDto } from '../../domain/dto/snapshot.dto';
import { AccuNumsService } from './accu-nums.service';

@Controller('analysis/accu-nums')
export class AccuNumsController {
  constructor(private readonly svc: AccuNumsService) {}

  @Get('draw-numbers')
  drawNumbers(): Promise<number[]> {
    return this.svc.drawNumbers();
  }

  @Get('winning-numbers-range')
  winningRange(@Query('draw_no', ParseIntPipe) drawNo: number): Promise<Record<string, unknown>[]> {
    return this.svc.winningRange(drawNo);
  }

  @Get('winning-number')
  winningNumber(@Query('draw_no', ParseIntPipe) drawNo: number): Promise<Record<string, unknown>> {
    return this.svc.winningNumber(drawNo);
  }

  @Get('winning-numbers-window')
  winningWindow(
    @Query('draw_no', ParseIntPipe) drawNo: number,
    @Query('window_size', ParseIntPipe) windowSize: number,
  ): Promise<Record<string, unknown>[]> {
    return this.svc.winningWindow(drawNo, windowSize);
  }

  @Post('snapshot')
  async postSnapshot(@Body() body: SnapshotSaveDto): Promise<MessageResponseDto> {
    await this.svc.saveSnapshot(body);
    return { message: '저장되었습니다.' };
  }

  @Get('snapshot')
  getSnapshot(@Query('draw_no', ParseIntPipe) drawNo: number) {
    return this.svc.getSnapshot(drawNo);
  }
}

/** 구 URL 호환: accumulated-numbers */
@Controller('analysis/accumulated-numbers')
export class AccuNumsLegacyController {
  constructor(private readonly svc: AccuNumsService) {}

  @Get('draw-numbers')
  drawNumbers(): Promise<number[]> {
    return this.svc.drawNumbers();
  }

  @Get('winning-numbers-range')
  winningRange(@Query('draw_no', ParseIntPipe) drawNo: number): Promise<Record<string, unknown>[]> {
    return this.svc.winningRange(drawNo);
  }

  @Get('winning-number')
  winningNumber(@Query('draw_no', ParseIntPipe) drawNo: number): Promise<Record<string, unknown>> {
    return this.svc.winningNumber(drawNo);
  }

  @Get('winning-numbers-window')
  winningWindow(
    @Query('draw_no', ParseIntPipe) drawNo: number,
    @Query('window_size', ParseIntPipe) windowSize: number,
  ): Promise<Record<string, unknown>[]> {
    return this.svc.winningWindow(drawNo, windowSize);
  }

  @Post('snapshot')
  async postSnapshot(@Body() body: SnapshotSaveDto): Promise<MessageResponseDto> {
    await this.svc.saveSnapshot(body);
    return { message: '저장되었습니다.' };
  }

  @Get('snapshot')
  getSnapshot(@Query('draw_no', ParseIntPipe) drawNo: number) {
    return this.svc.getSnapshot(drawNo);
  }
}
