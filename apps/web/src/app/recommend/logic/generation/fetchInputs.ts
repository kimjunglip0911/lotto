import type { WinningNumberRow } from '@/app/analysis/chi-square/types';
import { fetchChiSquareFullHistory } from '@/app/recommend/api/chi/chiHistory';
import { fetchFinalPickAdopted } from '@/app/recommend/logic/adopt/computeAdopted';

/** 채택 번호·카이제곱 이력을 병렬로 가져와 검증한다 */

export type GenerationInputs = {
  adopted: number[];
  fullHistory: WinningNumberRow[];
  infoMessage: string | null;
};

export const fetchGenerationInputs = async (
  apiUrl: string,
  drawNo: number,
): Promise<GenerationInputs> => {
  const [adoptedResult, fullHistory] = await Promise.all([
    fetchFinalPickAdopted(apiUrl, drawNo),
    fetchChiSquareFullHistory(apiUrl),
  ]);

  if (adoptedResult.error) throw new Error(adoptedResult.error);

  const adopted = adoptedResult.adopted;
  if (adopted.length < 6) {
    throw new Error('통합 채택 번호가 6개 미만입니다. 당첨번호가 등록된 회차인지 확인해 주세요.');
  }

  return { adopted, fullHistory, infoMessage: adoptedResult.infoMessage };
};
