import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { GenerateSaveDto } from '../domain/dto/recommend.dto';
import { RecommendService } from './recommend.service';

@Controller('recommend')
export class RecommendController {
  constructor(private readonly svc: RecommendService) {}

  @Get('exclusion-candidates')
  exclusionCandidates(
    @Query('draw_no') drawNoStr?: string,
  ): Promise<Record<string, unknown>> {
    const drawNo =
      drawNoStr != null && drawNoStr !== ''
        ? parseInt(drawNoStr, 10)
        : undefined;
    return this.svc.getExclusionCandidates(drawNo);
  }

  @Get('generate/wheel')
  generateWheel(
    @Query('count', ParseIntPipe) count: number,
    @Query('draw_no') drawNoStr?: string,
    @Query('seed') seedStr?: string,
  ): Record<string, unknown>[] {
    const drawNo =
      drawNoStr != null && drawNoStr !== ''
        ? parseInt(drawNoStr, 10)
        : undefined;
    const seed =
      seedStr != null && seedStr !== '' ? parseInt(seedStr, 10) : undefined;
    return this.svc.generateWheel(count, drawNo, seed);
  }

  @Post('generate-and-save')
  generateAndSave(
    @Body() body: GenerateSaveDto,
  ): Promise<Record<string, unknown>[]> {
    return this.svc.generateAndSave(body);
  }

  @Get('drawings')
  drawings(
    @Query('draw_no', ParseIntPipe) drawNo: number,
  ): Promise<Record<string, unknown>[]> {
    return this.svc.getDrawings(drawNo);
  }

  @Get('draw-duplicate-insight')
  drawDuplicateInsight(
    @Query('draw_no', ParseIntPipe) drawNo: number,
    @Query('count', ParseIntPipe) count: number,
  ): Record<string, unknown> {
    return this.svc.getDrawDuplicateInsight(drawNo, count);
  }
}
