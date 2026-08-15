import type { WinningNumberRow } from '@/lib/accu-nums/types';
import type { PositionBandDistributionRow } from '@/app/combination/types';
import { fetchWinningFullHistory } from '@/app/recommend/api/history/winningHistory';
import { loadStoredCombo } from '@/app/combination/api/loadStored';

export type GenerationInputs = {
  fullHistory: WinningNumberRow[];
  comboRows: PositionBandDistributionRow[];
};

export const fetchGenerationInputs = async (
  apiUrl: string,
): Promise<GenerationInputs> => {
  const [fullHistory, stored] = await Promise.all([
    fetchWinningFullHistory(apiUrl),
    loadStoredCombo({ baseUrl: apiUrl }),
  ]);
  return { fullHistory, comboRows: stored.rows };
};
