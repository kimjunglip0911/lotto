import type { WinningNumberRow } from '@/app/analysis/chi-square/types';
import { fetchChiSquareFullHistory } from '@/app/recommend/api/chi/chiHistory';

/** 조합 분석용 당첨 이력만 조회한다(번호 풀은 1~45 고정). */

export type GenerationInputs = {
  fullHistory: WinningNumberRow[];
};

export const fetchGenerationInputs = async (apiUrl: string): Promise<GenerationInputs> => {
  const fullHistory = await fetchChiSquareFullHistory(apiUrl);
  return { fullHistory };
};
