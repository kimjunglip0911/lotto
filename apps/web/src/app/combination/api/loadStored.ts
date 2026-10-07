import type { ComboPagePayload } from '../logic/storedRows';

const COMBO_API_PATH = '/api/analysis/combination';

/** 조합 분석 저장본을 GET한다. */
export async function loadStoredCombo(opts?: {
  baseUrl?: string;
  signal?: AbortSignal;
}): Promise<ComboPagePayload> {
  const url = `${opts?.baseUrl ?? ''}${COMBO_API_PATH}`;
  const res = await fetch(url, { signal: opts?.signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed request: ${res.status} ${url}`);
  return (await res.json()) as ComboPagePayload;
}
