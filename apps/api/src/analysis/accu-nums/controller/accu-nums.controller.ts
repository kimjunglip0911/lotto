/**
 * /api/analysis/accu-nums 주소로 들어오는 요청의 진입점입니다.
 * 공통 핸들러는 accu-nums.routes.base.ts에 있고, 여기서는 주소만 붙입니다.
 */
import { Controller } from '@nestjs/common';
import { AccuNumsService } from '../service/accu-nums.service';
import { SnapshotService } from '../service/snapshot.service';
import { AccuNumsRoutesBase } from './accu-nums.routes.base';

@Controller('analysis/accu-nums')
export class AccuNumsController extends AccuNumsRoutesBase {
  constructor(accuSvc: AccuNumsService, snapSvc: SnapshotService) {
    super(accuSvc, snapSvc);
  }
}
