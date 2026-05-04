import { isWinningNumberRow } from './logic/numberCounts';
import { ACCUMULATED_SNAPSHOT_SCHEMA_VERSION, type WinningNumberRow } from './types';

/** 백테스트 스크립트 등에서 베이스 URL 오버라이드 시 사용. 미지정이면 NEXT_PUBLIC_API_URL */
export type AccumulatedNumbersFetchContext = {
  signal?: AbortSignal;
  baseUrl?: string;
};

const resolveApiBaseUrl = (baseUrl?: string): string => {
  const raw = (baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
  return raw;
};

/** `/api/analysis/accumulated-numbers/` 이하 경로·쿼리(예: `draw-numbers`, `winning-number?draw_no=1`) */
export const accumulatedNumbersApiUrl = (pathWithQuery: string, baseUrl?: string): string => {
  const apiUrl = resolveApiBaseUrl(baseUrl);
  return `${apiUrl}/api/analysis/accumulated-numbers/${pathWithQuery}`;
};

export const parseNumberArrayResponse = (data: unknown, invalidMessage: string): number[] => {
  if (!Array.isArray(data)) {
    throw new Error(invalidMessage);
  }

  return data.filter((item): item is number => typeof item === 'number');
};

export const parseWinningNumberRowsResponse = (data: unknown, invalidMessage: string): WinningNumberRow[] => {
  if (!Array.isArray(data)) {
    throw new Error(invalidMessage);
  }

  return data.filter(isWinningNumberRow);
};

export const fetchDrawNumbers = async (ctx?: AccumulatedNumbersFetchContext): Promise<number[]> => {
  const signal = ctx?.signal;
  const baseUrl = ctx?.baseUrl;
  const response = await fetch(accumulatedNumbersApiUrl('draw-numbers', baseUrl), {
    signal,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch draw numbers: ${response.status}`);
  }

  const data: unknown = await response.json();
  return parseNumberArrayResponse(data, 'Draw numbers response is not an array');
};

export const fetchWinningNumberByDraw = async (drawNo: number): Promise<WinningNumberRow> => {
  const response = await fetch(accumulatedNumbersApiUrl(`winning-number?draw_no=${drawNo}`), {
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
    }
    throw new Error(`Failed to fetch selected winning number: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!isWinningNumberRow(data)) {
    throw new Error('Selected winning number response is invalid');
  }

  return data;
};

export const fetchWinningNumbersRange = async (
  drawNo: number,
  ctx?: Pick<AccumulatedNumbersFetchContext, 'baseUrl'>
): Promise<WinningNumberRow[]> => {
  const response = await fetch(accumulatedNumbersApiUrl(`winning-numbers-range?draw_no=${drawNo}`, ctx?.baseUrl), {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch winning numbers range: ${response.status}`);
  }

  const data: unknown = await response.json();
  return parseWinningNumberRowsResponse(data, 'Winning numbers range response is not an array');
};

export const fetchWinningNumbersWindow = async (
  drawNo: number,
  windowSize: number
): Promise<WinningNumberRow[]> => {
  const response = await fetch(
    accumulatedNumbersApiUrl(`winning-numbers-window?draw_no=${drawNo}&window_size=${windowSize}`),
    { cache: 'no-store' },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch winning numbers window: ${response.status}`);
  }

  const data: unknown = await response.json();
  return parseWinningNumberRowsResponse(data, 'Winning numbers window response is not an array');
};

export type MessageResponse = {
  message: string;
};

const parseMessageResponse = (data: unknown, invalidMessage: string): MessageResponse => {
  if (typeof data !== 'object' || data === null || !('message' in data)) {
    throw new Error(invalidMessage);
  }
  const message = (data as { message: unknown }).message;
  if (typeof message !== 'string') {
    throw new Error(invalidMessage);
  }
  return { message };
};

/** 누적번호 분석에서 최종 채택 4개만 DB에 저장한다(기준 회차당 UPSERT). */
export const saveAccumulatedNumbersSnapshot = async (
  anchorDrawNo: number,
  finalNumbers: readonly [number, number, number, number],
  ctx?: AccumulatedNumbersFetchContext
): Promise<MessageResponse> => {
  const signal = ctx?.signal;
  const baseUrl = ctx?.baseUrl;
  const response = await fetch(accumulatedNumbersApiUrl('snapshot', baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      anchor_draw_no: anchorDrawNo,
      schema_version: ACCUMULATED_SNAPSHOT_SCHEMA_VERSION,
      final_numbers: [...finalNumbers],
    }),
  });

  if (!response.ok) {
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
    throw new Error(detail);
  }

  const data: unknown = await response.json();
  return parseMessageResponse(data, 'Save snapshot response is invalid');
};
