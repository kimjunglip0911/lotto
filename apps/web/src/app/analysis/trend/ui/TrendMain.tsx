import type { TrendData } from '../hooks/useTrendData';
import type { TrendView } from '../hooks/useTrendView';
import { TrendChart } from './chart/TrendChart';
import { SearchBar } from './search/SearchBar';
import { StatNote } from './StatNote';
import { SumCards } from './summary/SumCards';
import { DevBinTbl } from './table/DevBinTbl';
import { TrendTbl } from './table/TrendTbl';

export const TrendMain = ({ data, view }: { data: TrendData; view: TrendView }) => {
  return (
    <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
      <SearchBar
        selectedDraw={data.selectedDraw}
        onChangeSelectedDraw={data.setSelectedDraw}
        availableDraws={data.availableDraws}
        isLoadingDraws={data.isLoadingDraws}
        isSearching={data.isSearching}
        onSearch={() => void data.handleSearch()}
        isLoadingWinningNumber={data.isLoadingWinningNumber}
        winningNumberError={data.winningNumberError}
        selectedWinningNumber={data.selectedWinningNumber}
        selectedMainNumbers={view.selectedMainNumbers}
        statusMessage={view.statusMessage}
      />
      {view.canShowPanels && (
        <SumCards historyCount={data.historyCount} baseline={view.baseline} kTrend={view.kTrend} />
      )}
      <TrendChart
        noHistory={view.noHistory}
        hasSearched={view.hasSearched}
        isSearching={data.isSearching}
        searchError={data.searchError}
        hasResults={view.hasResults}
        trendResults={data.trendResults}
        selectedWinningNumberSet={view.selectedWinningNumberSet}
        chartTotalW={view.chartTotalW}
        chartHeight={view.chartHeight}
        chartPaddingTop={view.chartPaddingTop}
        chartPaddingBottom={view.chartPaddingBottom}
        chartWidthPerNum={view.chartWidthPerNum}
        maxRate={view.maxRate}
        baselineY={view.baselineY}
        baseline={view.baseline}
        kTrend={view.kTrend}
      />
      {view.canShowPanels && data.deviationBinsSummary !== null && (
        <DevBinTbl summary={data.deviationBinsSummary} />
      )}
      <TrendTbl
        noHistory={view.noHistory}
        hasSearched={view.hasSearched}
        isSearching={data.isSearching}
        searchError={data.searchError}
        hasResults={view.hasResults}
        trendResults={data.trendResults}
        selectedWinningNumberSet={view.selectedWinningNumberSet}
        baseline={view.baseline}
      />
      <StatNote kTrend={view.kTrend} />
    </main>
  );
};
