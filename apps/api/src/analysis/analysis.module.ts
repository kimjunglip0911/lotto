import { Module } from '@nestjs/common';
import { AccuNumsModule } from './accu-nums/accu-nums.module';

@Module({
  imports: [AccuNumsModule],
})
export class AnalysisModule {}
