import { Module } from '@nestjs/common';
import { AnalysisDbUtil } from '../shared/analysis-db.util';
import { ChiController } from './controller/chi.controller';
import { ChiService } from './service/chi.service';

@Module({
  controllers: [ChiController],
  providers: [ChiService, AnalysisDbUtil],
})
export class ChiModule {}
