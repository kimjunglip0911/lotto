import { Module } from '@nestjs/common';
import { AnalysisDbUtil } from '../shared/analysis-db.util';
import { RunStreakController } from './run-streak.controller';
import { RunStreakService } from './run-streak.service';

@Module({
  controllers: [RunStreakController],
  providers: [RunStreakService, AnalysisDbUtil],
})
export class RunStreakModule {}
