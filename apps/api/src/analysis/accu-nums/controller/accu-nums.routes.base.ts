/**
 * 누적 번호 분석 API의 공통 요청 처리입니다.
 * 회차·당첨·스냅샷 조회·저장 경로를 정의하고, 실제 일은 service 폴더에 넘깁니다.
 * 신규 주소와 구 accumulated-numbers 주소가 이 클래스를 같이 씁니다.
 */
import {
  Body,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { MessageResponseDto } from '../../../domain/dto/message.dto';
import { SnapshotSaveDto } from '../../../domain/dto/snapshot.dto';
import { AccuNumsService } from '../service/accu-nums.service';
import { SnapshotService } from '../service/snapshot.service';

export abstract class AccuNumsRoutesBase {
  constructor(
    protected readonly accuSvc: AccuNumsService,
    protected readonly snapSvc: SnapshotService,
  ) {}

  @Get('draw-numbers')
  drawNumbers(): Promise<number[]> {
    return this.accuSvc.drawNumbers();
  }

  @Get('winning-numbers-range')
  winningRange(
    @Query('draw_no', ParseIntPipe) drawNo: number,
  ): Promise<Record<string, unknown>[]> {
    return this.accuSvc.winningRange(drawNo);
  }

  @Get('winning-number')
  winningNumber(
    @Query('draw_no', ParseIntPipe) drawNo: number,
  ): Promise<Record<string, unknown>> {
    return this.accuSvc.winningNumber(drawNo);
  }

  @Get('winning-numbers-window')
  winningWindow(
    @Query('draw_no', ParseIntPipe) drawNo: number,
    @Query('window_size', ParseIntPipe) windowSize: number,
  ): Promise<Record<string, unknown>[]> {
    return this.accuSvc.winningWindow(drawNo, windowSize);
  }

  @Post('snapshot')
  async postSnapshot(
    @Body() body: SnapshotSaveDto,
  ): Promise<MessageResponseDto> {
    await this.snapSvc.saveSnapshot(body);
    return { message: '저장되었습니다.' };
  }

  @Get('snapshot')
  getSnapshot(@Query('draw_no', ParseIntPipe) drawNo: number) {
    return this.snapSvc.getSnapshot(drawNo);
  }
}
