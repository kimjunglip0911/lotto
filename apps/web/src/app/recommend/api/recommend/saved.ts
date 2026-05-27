import { accuNumsApiUrl, recommendApiUrl } from '@/app/recommend/api/core/url';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import { isGeneratedSet, isWinningRow } from '@/app/recommend/helpers/validators';

/** 저장된 추천 세트와 당첨번호를 함께 조회한다 */

export type SavedRecommendData = {
  sets: GeneratedSet[];
  winningNumbers: number[] | null;
};

export const fetchSavedRecommendData = async (
  apiUrl: string,
  drawNo: number,
): Promise<SavedRecommendData> => {
  const [drawingsResponse, winningNumberResponse] = await Promise.all([
    fetch(recommendApiUrl(`/api/recommend/drawings?draw_no=${drawNo}`, apiUrl)),
    fetch(accuNumsApiUrl(`winning-number?draw_no=${drawNo}`, apiUrl)),
  ]);

  if (!drawingsResponse.ok) {
    throw new Error(`Failed to fetch drawings: ${drawingsResponse.status}`);
  }

  const drawingsData: unknown = await drawingsResponse.json();
  if (!Array.isArray(drawingsData)) {
    throw new Error('Drawings response is not an array');
  }

  const winningNumberData: unknown = winningNumberResponse.ok
    ? await winningNumberResponse.json()
    : null;
  const winningNumbers = isWinningRow(winningNumberData)
    ? [
        winningNumberData.num1,
        winningNumberData.num2,
        winningNumberData.num3,
        winningNumberData.num4,
        winningNumberData.num5,
        winningNumberData.num6,
      ]
    : null;

  return {
    sets: drawingsData.filter(isGeneratedSet),
    winningNumbers,
  };
};
