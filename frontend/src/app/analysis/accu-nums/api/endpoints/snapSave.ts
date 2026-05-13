import { ACCUMULATED_SNAPSHOT_SCHEMA_VERSION } from '../../types';
import { fetchAccumulatedApi } from '../fetchCore';
import { parseMessageResponse } from '../parse';
import type { AccumulatedNumbersFetchContext, MessageResponse } from '../types';

// 누적번호 분석에서 최종 채택 4개만 DB에 저장(기준 회차당 UPSERT).

const readSnapshotError = async (response: Response): Promise<string> => {
  let detail = `저장 요청 실패 (${response.status})`;
  try {
    const errBody: unknown = await response.json();
    if (typeof errBody === 'object' && errBody !== null && 'detail' in errBody) {
      const d = (errBody as { detail: unknown }).detail;
      if (typeof d === 'string') {
        detail = d;
      } else if (Array.isArray(d) && d.length > 0 && typeof d[0] === 'object' && d[0] !== null && 'msg' in d[0]) {
        detail = String((d[0] as { msg: unknown }).msg);
      }
    }
  } catch {
    /* 응답 본문 없음 */
  }
  return detail;
};

export const saveAccumulatedNumbersSnapshot = async (
  anchorDrawNo: number,
  finalNumbers: readonly [number, number, number, number],
  ctx?: AccumulatedNumbersFetchContext,
): Promise<MessageResponse> => {
  const response = await fetchAccumulatedApi(
    'snapshot',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctx?.signal,
      body: JSON.stringify({
        anchor_draw_no: anchorDrawNo,
        schema_version: ACCUMULATED_SNAPSHOT_SCHEMA_VERSION,
        final_numbers: [...finalNumbers],
      }),
    },
    ctx?.baseUrl,
  );

  if (!response.ok) {
    throw new Error(await readSnapshotError(response));
  }

  const data: unknown = await response.json();
  return parseMessageResponse(data, 'Save snapshot response is invalid');
};
