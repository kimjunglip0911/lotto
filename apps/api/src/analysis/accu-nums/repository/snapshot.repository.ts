/**
 * 분석 스냅샷을 DB에 저장하거나 한 줄 조회합니다.
 * queries/snap.queries.ts의 문장만 실행하고, 판단·변환은 service가 합니다.
 * DB 접속 실패 시 화면에는 일반적인 서버 오류로 보일 수 있습니다.
 */
import { Injectable } from '@nestjs/common';
import { SqliteService } from '../../../db/sqlite.service';
import * as SnapQ from '../queries/snap.queries';

@Injectable()
export class SnapshotRepository {
  constructor(private readonly sqlite: SqliteService) {}

  async saveSnapshot(
    anchorDrawNo: number,
    schemaVersion: number,
    n1: number,
    n2: number,
    n3: number,
    n4: number,
  ): Promise<void> {
    await this.sqlite.withDbRetry((db) => {
      db.prepare(SnapQ.UPSERT_SNAP).run(
        anchorDrawNo,
        schemaVersion,
        n1,
        n2,
        n3,
        n4,
      );
    });
  }

  async getSnapshotRow(
    anchorDrawNo: number,
  ): Promise<Record<string, unknown> | null> {
    const row = await this.sqlite.fetchOne(SnapQ.SNAP_BY_DRAW, [anchorDrawNo]);
    return row ?? null;
  }
}
