/** useAccView에 넘기는 입력 필드 목록 타입만 둔다. */

import type {
  FinalNumberPlan,
  StrategyChartData,
  WinningNumberRow,
  WindowCountResultMap,
} from '../types';

export type AccViewIn = {
  availableDraws: number[];
  selectedDraw: string;
  isLoadingDraws: boolean;
  drawLoadError: string | null;
  isSearching: boolean;
  searchError: string | null;
  searchedDraw: string;
  selectedWinningNumber: WinningNumberRow | null;
  windowCountResultMap: WindowCountResultMap;
  strategyCharts: StrategyChartData[];
  finalNumberPlan: FinalNumberPlan | null;
};
