import type { StreakResult, WinningNumberRow } from '../types';
import { ColdNumbersSection } from './ColdNumbersSection';
import { SearchControls } from './SearchControls';
import { StatisticalNote } from './StatisticalNote';
import { StreakChart } from './StreakChart';
import { StreakTable } from './StreakTable';
import { SummaryCards } from './SummaryCards';

// 화면 본문(main 안쪽) 한 줄을 담당하는 조립 컴포넌트입니다.
// 검색·요약·차트·저빈도·표·주의 6개 영역을 순서대로 배치합니다.

export type AbsenceStreakBodyProps = {
  availableDraws: number[];
  selectedDraw: string;
  setSelectedDraw: (draw: string) => void;
  isLoadingDraws: boolean;
  isSearching: boolean;
  handleSearch: () => void;
  isLoadingWinningNumber: boolean;
  winningNumberError: string | null;
  selectedWinningNumber: WinningNumberRow | null;
  statusMessage: string | null;
  canShowStreakPanels: boolean;
  analyzedDrawCount: number;
  maxStreak: number;
  averageStreak: number;
  top5PctThreshold: number;
  coldNumbers: StreakResult[];
  hasSearched: boolean;
  noHistory: boolean;
  searchError: string | null;
  streakResults: StreakResult[];
  selectedWinningNumberSet: Set<number> | null;
};

export const AbsenceStreakBody = (p: AbsenceStreakBodyProps) => (
  <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
    <SearchControls
      availableDraws={p.availableDraws}
      selectedDraw={p.selectedDraw}
      onSelectedDrawChange={p.setSelectedDraw}
      isLoadingDraws={p.isLoadingDraws}
      isSearching={p.isSearching}
      handleSearch={p.handleSearch}
      isLoadingWinningNumber={p.isLoadingWinningNumber}
      winningNumberError={p.winningNumberError}
      selectedWinningNumber={p.selectedWinningNumber}
      statusMessage={p.statusMessage}
    />
    {p.canShowStreakPanels && (
      <SummaryCards
        analyzedDrawCount={p.analyzedDrawCount}
        maxStreak={p.maxStreak}
        averageStreak={p.averageStreak}
        top5PctThreshold={p.top5PctThreshold}
        coldNumbersCount={p.coldNumbers.length}
      />
    )}
    <StreakChart
      hasSearched={p.hasSearched}
      noHistory={p.noHistory}
      isSearching={p.isSearching}
      searchError={p.searchError}
      streakResults={p.streakResults}
      maxStreak={p.maxStreak}
      top5PctThreshold={p.top5PctThreshold}
      selectedWinningNumberSet={p.selectedWinningNumberSet}
    />
    {p.canShowStreakPanels && <ColdNumbersSection coldNumbers={p.coldNumbers} averageStreak={p.averageStreak} />}
    <StreakTable
      hasSearched={p.hasSearched}
      noHistory={p.noHistory}
      isSearching={p.isSearching}
      searchError={p.searchError}
      streakResults={p.streakResults}
    />
    <StatisticalNote />
  </main>
);
