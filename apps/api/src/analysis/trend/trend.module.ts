import { Module } from '@nestjs/common';
import { AnalysisDbUtil } from '../shared/analysis-db.util';
import { TrendController } from './trend.controller';
import { TrendService } from './trend.service';

@Module({
  controllers: [TrendController],
  providers: [TrendService, AnalysisDbUtil],
})
export class TrendModule {}
