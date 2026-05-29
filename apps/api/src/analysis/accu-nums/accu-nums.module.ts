import { Module } from '@nestjs/common';
import { AnalysisDbUtil } from '../shared/analysis-db.util';
import {
  AccuNumsController,
  AccuNumsLegacyController,
} from './accu-nums.controller';
import { AccuNumsRepository } from './accu-nums.repository';
import { AccuNumsService } from './accu-nums.service';

@Module({
  controllers: [AccuNumsController, AccuNumsLegacyController],
  providers: [AccuNumsService, AccuNumsRepository, AnalysisDbUtil],
})
export class AccuNumsModule {}
