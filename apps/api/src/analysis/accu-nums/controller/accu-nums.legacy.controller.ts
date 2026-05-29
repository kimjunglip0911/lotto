/**
 * 구 주소 /api/analysis/accumulated-numbers 호환용 진입점입니다.
 * 동작은 신규 accu-nums와 동일하며, 화면·구 서버 연동이 끊기지 않게 둡니다.
 */
import { Controller } from '@nestjs/common';
import { AccuNumsService } from '../service/accu-nums.service';
import { SnapshotService } from '../service/snapshot.service';
import { AccuNumsRoutesBase } from './accu-nums.routes.base';

@Controller('analysis/accumulated-numbers')
export class AccuNumsLegacyController extends AccuNumsRoutesBase {
  constructor(accuSvc: AccuNumsService, snapSvc: SnapshotService) {
    super(accuSvc, snapSvc);
  }
}
