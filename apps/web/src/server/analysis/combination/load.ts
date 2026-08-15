import 'server-only';
import type { ComboStoredPayload } from '@/app/combination/logic/storedRows';
import { fromBandRows } from '@/app/combination/logic/fromStored';
import { listBandRows } from './band-repo';
import { refreshComboStats } from './refresh';

/** 저장본을 읽고, 비어 있으면 당첨 이력으로 한 번 채운다. */
export async function loadComboBands(): Promise<ComboStoredPayload> {
  let rows = await listBandRows();
  if (rows.length === 0) {
    await refreshComboStats();
    rows = await listBandRows();
  }
  return fromBandRows(rows);
}
