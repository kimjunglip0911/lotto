import { Module } from '@nestjs/common';
import { AnalysisDbUtil } from '../shared/analysis-db.util';
import { AccuNumsController } from './controller/accu-nums.controller';
import { AccuNumsLegacyController } from './controller/accu-nums.legacy.controller';
import { SnapshotRepository } from './repository/snapshot.repository';
import { AccuNumsService } from './service/accu-nums.service';
import { SnapshotService } from './service/snapshot.service';

@Module({
  controllers: [AccuNumsController, AccuNumsLegacyController],
  providers: [
    AccuNumsService,
    SnapshotService,
    SnapshotRepository,
    AnalysisDbUtil,
  ],
})
export class AccuNumsModule {}
