import { isWinningNumberRow } from './logic/numberCounts';
import type { WinningNumberRow } from './types';

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
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch draw numbers: ${response.status}`);
  }

  const data: unknown = await response.json();
  return parseNumberArrayResponse(data, 'Draw numbers response is not an array');
};

export const fetchWinningNumberByDraw = async (drawNo: number): Promise<WinningNumberRow> => {
  const response = await fetch(accumulatedNumbersApiUrl(`winning-number?draw_no=${drawNo}`));

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
  const response = await fetch(
    accumulatedNumbersApiUrl(`winning-numbers-range?draw_no=${drawNo}`, ctx?.baseUrl)
  );

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
    accumulatedNumbersApiUrl(`winning-numbers-window?draw_no=${drawNo}&window_size=${windowSize}`)
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch winning numbers window: ${response.status}`);
  }

  const data: unknown = await response.json();
  return parseWinningNumberRowsResponse(data, 'Winning numbers window response is not an array');
};
