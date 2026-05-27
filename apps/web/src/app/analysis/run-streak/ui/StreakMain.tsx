import type { StreakData } from '../hooks/useStData';
import type { StreakView } from '../hooks/useStView';
import { SearchBar } from './search/SearchBar';
import { ColdNums } from './summary/ColdNums';
import { SumCards } from './summary/SumCards';
import { StreakTbl } from './table/StreakTbl';
import { StatNote } from './StatNote';

export const StreakMain = ({ data, view }: { data: StreakData; view: StreakView }) => {
  const { canShowStreakPanels, coldNumbers, maxStreak } = view;
  return (
    <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
      <SearchBar
        availableDraws={data.availableDraws}
        selectedDraw={data.selectedDraw}
        setSelectedDraw={data.setSelectedDraw}
        isLoadingDraws={data.isLoadingDraws}
        isSearching={data.isSearching}
        handleSearch={() => void data.handleSearch()}
        isLoadingWinningNumber={data.isLoadingWinningNumber}
        selectedWinningNumber={data.selectedWinningNumber}
        statusMessage={view.statusMessage}
      />
      {canShowStreakPanels && (
        <SumCards analyzedDrawCount={data.analyzedDrawCount} maxStreak={maxStreak} />
      )}
      {canShowStreakPanels && (
        <ColdNums coldNumbers={coldNumbers} averageStreak={data.averageStreak} />
      )}
      <StreakTbl
        hasSearched={view.hasSearched}
        noHistory={view.noHistory}
        isSearching={data.isSearching}
        searchError={data.searchError}
        streakResults={data.streakResults}
      />
      <StatNote />
    </main>
  );
};
