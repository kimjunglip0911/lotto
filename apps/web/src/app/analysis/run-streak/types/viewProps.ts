import type { StreakResult } from './streak';
import type { WinningNumberRow } from './row';

export type StreakSearchProps = {
  availableDraws: number[];
  selectedDraw: string;
  setSelectedDraw: (draw: string) => void;
  isLoadingDraws: boolean;
  isSearching: boolean;
  handleSearch: () => void;
  isLoadingWinningNumber: boolean;
  selectedWinningNumber: WinningNumberRow | null;
  statusMessage: string | null;
};

export type StreakSummaryProps = {
  canShowStreakPanels: boolean;
  analyzedDrawCount: number;
  maxStreak: number;
  averageStreak: number;
  coldNumbers: StreakResult[];
};

export type StreakTableProps = {
  hasSearched: boolean;
  noHistory: boolean;
  isSearching: boolean;
  searchError: string | null;
  streakResults: StreakResult[];
};
