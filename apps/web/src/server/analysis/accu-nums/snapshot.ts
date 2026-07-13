import 'server-only';
import { HttpError } from '@/server/http/error';
import type { SnapshotSave } from '@/server/validate/snapshot';
import { assertSnapSave } from './helpers/snapshot.valid';
import * as snapRepo from './snap-repo';

const SNAP_NOT_FOUND = '해당 회차에 저장된 분석 스냅샷이 없습니다.';

export async function saveSnapshot(body: SnapshotSave): Promise<void> {
  assertSnapSave(body);
  const [n1, n2, n3, n4] = body.final_numbers;
  await snapRepo.saveSnapshotRow(
    body.anchor_draw_no,
    body.schema_version,
    n1,
    n2,
    n3,
    n4,
  );
}

export async function getSnapshot(drawNo: number) {
  const row = await snapRepo.getSnapshotRow(drawNo);
  if (!row) throw new HttpError(404, SNAP_NOT_FOUND);
  return {
    anchor_draw_no: Number(row.anchor_draw_no),
    schema_version: Number(row.schema_version),
    final_numbers: [
      Number(row.final_num1),
      Number(row.final_num2),
      Number(row.final_num3),
      Number(row.final_num4),
    ],
    updated_at: String(row.updated_at),
  };
}
