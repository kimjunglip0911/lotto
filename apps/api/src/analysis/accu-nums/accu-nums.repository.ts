import { Injectable } from '@nestjs/common';
import { SqliteService } from '../../db/sqlite.service';
import * as Q from './accu-nums.queries';

@Injectable()
export class AccuNumsRepository {
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
      db.prepare(Q.UPSERT_ACCUMULATED_SNAPSHOT).run(
        anchorDrawNo,
        schemaVersion,
        n1,
        n2,
        n3,
        n4,
      );
    });
  }

  async getSnapshotRow(anchorDrawNo: number): Promise<Record<string, unknown> | null> {
    const row = await this.sqlite.fetchOne(Q.GET_ACCUMULATED_SNAPSHOT_BY_DRAW, [anchorDrawNo]);
    return row ?? null;
  }
}
