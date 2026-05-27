import {
  Body,
  Controller,
  Delete,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { SaveWinningDto } from '../domain/dto/winning.dto';
import { HomeService } from './home.service';

@Controller('drawings')
export class HomeController {
  constructor(private readonly svc: HomeService) {}

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

  @Get('recommend')
  recommend(@Query('draw_no') drawNoStr?: string): Promise<Record<string, unknown>[]> {
    const drawNo =
      drawNoStr != null && drawNoStr !== '' ? parseInt(drawNoStr, 10) : undefined;
    return this.svc.recommendDrawings(drawNo);
  }

  @Get('by-no')
  byNo(@Query('draw_no', ParseIntPipe) drawNo: number): Promise<Record<string, unknown>[]> {
    return this.svc.getByNo(drawNo);
  }

  @Get('winning-by-no')
  winningByNo(@Query('draw_no', ParseIntPipe) drawNo: number): Promise<Record<string, unknown>> {
    return this.svc.winningByNo(drawNo);
  }

  @Post('save-winning')
  saveWinning(@Body() body: SaveWinningDto): Promise<{ message: string }> {
    return this.svc.saveWinning(body);
  }
}
