/**
 * 분석 스냅샷을 DB에 저장하거나 한 줄 조회합니다.
 */
import { Injectable } from '@nestjs/common';
import { PgService } from '../../../db/pg.service';
import * as SnapQ from '../queries/snap.queries';

@Injectable()
export class SnapshotRepository {
  constructor(private readonly db: PgService) {}

  async saveSnapshot(
    anchorDrawNo: number,
    schemaVersion: number,
    n1: number,
    n2: number,
    n3: number,
    n4: number,
  ): Promise<void> {
    await this.db.run(SnapQ.UPSERT_SNAP, [
      anchorDrawNo,
      schemaVersion,
      n1,
      n2,
      n3,
      n4,
    ]);
  }

  async getSnapshotRow(
    anchorDrawNo: number,
  ): Promise<Record<string, unknown> | null> {
    const row = await this.db.fetchOne(SnapQ.SNAP_BY_DRAW, [anchorDrawNo]);
    return row ?? null;
  }
}
