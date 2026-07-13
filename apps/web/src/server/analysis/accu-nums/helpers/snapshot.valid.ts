import { HttpError } from '@/server/http/error';
import type { SnapshotSave } from '@/server/validate/snapshot';

/** 스냅샷 저장 전 회차·번호 범위 검사 */
export function assertSnapSave(body: SnapshotSave): void {
  if (body.anchor_draw_no <= 1) {
    throw new HttpError(
      400,
      '회차 1은 이전 회차 집계가 없어 저장할 수 없습니다.',
    );
  }
  for (const n of body.final_numbers) {
    if (n < 1 || n > 45) {
      throw new HttpError(400, 'final_numbers must be in 1..45');
    }
  }
}
