import { isWinningNumberRow } from '@/app/analysis/chi-square/logic/guards';
import type { WinningNumberRow } from '@/app/analysis/chi-square/types';
import { chiSquareApiUrl } from '@/app/recommend/api/core/url';
import { fetchJson } from '@/app/recommend/api/core/fetchCore';

/** chi-square 회차 목록과 max+1 미만 전체 당첨 이력을 조회한다 */

export const fetchChiSquareFullHistory = async (apiUrl: string): Promise<WinningNumberRow[]> => {
  const drawsData = await fetchJson<unknown>(chiSquareApiUrl('draw-numbers', apiUrl));
  if (!Array.isArray(drawsData)) {
    throw new Error('Draw numbers response is not an array');
  }
  const draws = drawsData.filter((item): item is number => typeof item === 'number');
  if (draws.length === 0) return [];

  const maxDraw = Math.max(...draws);
  const rangePayload = await fetchJson<unknown>(
    chiSquareApiUrl(`winning-numbers-range?draw_no=${maxDraw + 1}`, apiUrl),
  );
  if (!Array.isArray(rangePayload)) {
    throw new Error('Winning numbers range response is not an array');
  }
  return rangePayload.filter(isWinningNumberRow);
};
