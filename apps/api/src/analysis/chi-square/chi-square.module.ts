import { Module } from '@nestjs/common';
import { AnalysisDbUtil } from '../shared/analysis-db.util';
import { ChiSquareController } from './chi-square.controller';
import { ChiSquareService } from './chi-square.service';

@Module({
  controllers: [ChiSquareController],
  providers: [ChiSquareService, AnalysisDbUtil],
})
export class ChiSquareModule {}
