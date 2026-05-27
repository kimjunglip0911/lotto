import { Module } from '@nestjs/common';
import { AccuNumsModule } from './accu-nums/accu-nums.module';
import { ChiSquareModule } from './chi-square/chi-square.module';
import { RunStreakModule } from './run-streak/run-streak.module';
import { TrendModule } from './trend/trend.module';

@Module({
  imports: [RunStreakModule, ChiSquareModule, TrendModule, AccuNumsModule],
})
export class AnalysisModule {}
