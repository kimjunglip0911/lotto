import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { fetchWinningFullHistory } from '@/app/recommend/api/history/winningHistory';

/** 조합 분석용 당첨 이력을 조회한다(번호 풀은 1~45 고정, 통계 윈도우는 runPipeline에서 적용). */

export type GenerationInputs = {
  fullHistory: WinningNumberRow[];
};

export const fetchGenerationInputs = async (apiUrl: string): Promise<GenerationInputs> => {
  const fullHistory = await fetchWinningFullHistory(apiUrl);
  return { fullHistory };
};
