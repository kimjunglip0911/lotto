import 'server-only';
import { toWindows } from '@/app/combination/logic/windows';
import type { ComboPagePayload } from '@/app/combination/logic/storedRows';
import { fromBandRows } from '@/app/combination/logic/fromStored';
import { listBandRows, listWinners } from './band-repo';
import { refreshComboStats } from './refresh';
import { toWinRow } from './toWinRow';

/** 저장본을 읽고, 비어 있으면 당첨 이력으로 한 번 채운다. */
export async function loadComboBands(): Promise<ComboPagePayload> {
  let rows = await listBandRows();
  if (rows.length === 0) {
    await refreshComboStats();
    rows = await listBandRows();
  }
  const winners = (await listWinners()).map(toWinRow);
  return { ...fromBandRows(rows), windows: toWindows(winners) };
}
