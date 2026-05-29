/**
 * /api/drawings 주소로 들어오는 요청의 진입점입니다.
 * 목록 조회, 전체 삭제, 회차 목록, 회차별 번호, 당첨번호 조회·저장만 받아 서비스에 넘깁니다.
 * 실제 DB 작업은 service/drawings.service.ts가 담당합니다.
 * 잘못된 회차나 저장 실패 시 서비스가 돌려준 오류가 그대로 화면에 전달됩니다.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { SaveWinningDto } from '../../domain/dto/winning.dto';
import { DrawingsService } from '../service/drawings.service';

@Controller('drawings')
export class DrawingsController {
  constructor(private readonly svc: DrawingsService) {}

  @Get()
  getDrawings(): Promise<Record<string, unknown>[]> {
    return this.svc.getDrawings();
  }

  @Delete('all')
  deleteAll(): Promise<{ message: string }> {
    return this.svc.deleteAll();
  }

  @Get('draw-numbers')
  drawNumbers(): Promise<number[]> {
    return this.svc.drawNumbers();
  }

  @Get('by-no')
  byNo(
    @Query('draw_no', ParseIntPipe) drawNo: number,
  ): Promise<Record<string, unknown>[]> {
    return this.svc.getByNo(drawNo);
  }

  @Get('winning-by-no')
  winningByNo(
    @Query('draw_no', ParseIntPipe) drawNo: number,
  ): Promise<Record<string, unknown>> {
    return this.svc.winningByNo(drawNo);
  }

  @Post('save-winning')
  saveWinning(@Body() body: SaveWinningDto): Promise<{ message: string }> {
    return this.svc.saveWinning(body);
  }
}
