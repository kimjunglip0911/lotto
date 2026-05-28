import { isWinningNumberRow } from '@/app/analysis/chi-square/logic/guards';
import type { WinningNumberRow } from '@/app/analysis/chi-square/types';
import { chiSquareApiUrl } from '@/app/recommend/api/core/url';
import { fetchJson } from '@/app/recommend/api/core/fetchCore';

/** chi-square 기준 1회차~최신 회차까지 전체 당첨 번호 이력을 조회한다 */

export const fetchChiSquareFullHistory = async (apiUrl: string): Promise<WinningNumberRow[]> => {
  const drawsData = await fetchJson<unknown>(chiSquareApiUrl('draw-numbers', apiUrl));
  if (!Array.isArray(drawsData)) {
    throw new Error('Draw numbers response is not an array');
  }
  const draws = drawsData.filter((item): item is number => typeof item === 'number');
  if (draws.length === 0) return [];

  const latestDraw = Math.max(...draws);
  // range API: draw_no는 상한(미포함) → latestDraw+1이면 latestDraw회차까지 포함
  const rangeUpper = latestDraw + 1;
  const rangePayload = await fetchJson<unknown>(
    chiSquareApiUrl(`winning-numbers-range?draw_no=${rangeUpper}`, apiUrl),
  );
  if (!Array.isArray(rangePayload)) {
    throw new Error('Winning numbers range response is not an array');
  }
  return rangePayload.filter(isWinningNumberRow);
};
