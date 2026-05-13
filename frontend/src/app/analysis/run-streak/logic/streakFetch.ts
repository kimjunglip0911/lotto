import { fetchJson, runStreakUrl } from './api';
import { isWinningNumberRow, type WinningNumberRow } from '../types';

// 연속 출현 화면 전용입니다. 회차 번호 목록·당첨 한 줄·과거 당첨 목록을 서버에서 가져오고,
// 숫자·배열 형태가 맞는지 여기서 확인한 뒤 화면 쪽으로 넘깁니다.

type FetchOpts = { signal?: AbortSignal };

const noStore = { cache: 'no-store' as RequestCache };

export const loadDrawNumbers = async ({ signal }: FetchOpts = {}): Promise<number[]> => {
  const data = await fetchJson<unknown>(runStreakUrl('draw-numbers'), { signal, ...noStore });
  if (!Array.isArray(data)) throw new Error('Draw numbers response is not an array');
  return data.filter((item): item is number => typeof item === 'number');
};

export const loadFirstDrawWinning = async (
  drawNo: number,
  { signal }: FetchOpts = {},
): Promise<WinningNumberRow> => {
  const data = await fetchJson<unknown>(runStreakUrl(`winning-number?draw_no=${drawNo}`), {
    signal,
    ...noStore,
  });
  if (!isWinningNumberRow(data)) throw new Error('Winning number response is invalid');
  return data;
};

export const loadDrawWithHistory = async (
  drawNo: number,
  { signal }: FetchOpts = {},
): Promise<{ winning: WinningNumberRow; rows: WinningNumberRow[] }> => {
  const init: RequestInit = { ...noStore };
  if (signal) init.signal = signal;
  const [winRes, rangeRes] = await Promise.all([
    fetch(runStreakUrl(`winning-number?draw_no=${drawNo}`), init),
    fetch(runStreakUrl(`winning-numbers-range?draw_no=${drawNo}`), init),
  ]);
  if (!winRes.ok) {
    if (winRes.status === 404) throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
    throw new Error(`Failed to fetch winning number: ${winRes.status}`);
  }
  if (!rangeRes.ok) throw new Error(`Failed to fetch winning numbers range: ${rangeRes.status}`);
  const winning: unknown = await winRes.json();
  const range: unknown = await rangeRes.json();
  if (!isWinningNumberRow(winning)) throw new Error('Winning number response is invalid');
  if (!Array.isArray(range)) throw new Error('Winning numbers range response is not an array');
  return { winning, rows: range.filter(isWinningNumberRow) };
};
