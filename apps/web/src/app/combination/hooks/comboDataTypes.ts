import type { ComboWinView } from '../types/window';

export type UseCombinationAnalysisDataResult = {
  isLoading: boolean;
  loadError: string | null;
  windows: ComboWinView[];
};
