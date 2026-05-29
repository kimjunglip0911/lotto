import { Module } from '@nestjs/common';
import { AccuNumsModule } from './accu-nums/accu-nums.module';
import { ChiModule } from './chi-square/chi.module';
import { RunStreakModule } from './run-streak/run-streak.module';
import { TrendModule } from './trend/trend.module';

@Module({
  imports: [RunStreakModule, ChiModule, TrendModule, AccuNumsModule],
})
export class AnalysisModule {}
