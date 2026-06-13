'use client';

import type { useFinalPickData } from '../hooks/useFinalPickData';
import { useFinalPickView } from '../hooks/useFinalPickView';
import { ComprehensiveChart } from './chart/ComprehensiveChart';
import { SearchPanel } from './search/SearchPanel';

type Props = { data: ReturnType<typeof useFinalPickData> };

/** 통합 분석 본문 — 검색·종합 차트. */
export function FinalPickMain({ data }: Props) {
  const view = useFinalPickView(data);

  return (
    <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
      <SearchPanel
        availableDraws={data.availableDraws}
        selectedDraw={data.selectedDraw}
        onSelectedDrawChange={data.setSelectedDraw}
        onSearch={() => void data.handleSearch()}
        isLoadingDraws={data.isLoadingDraws}
        isSearching={data.isSearching}
        isLoadingWinningNumber={data.isLoadingWinningNumber}
        winningNumberError={data.winningNumberError}
        selectedWinningNumber={data.selectedWinningNumber}
        selectedMainNumbers={view.selectedMainNumbers}
        searchError={data.searchError ?? data.drawLoadError}
      />
      <ComprehensiveChart
        counts={data.comprehensiveChartCounts}
        analyzedDrawCountForChart={data.comprehensiveChartAnalyzedDrawCount}
        highlightedNumbers={view.mainWinningNumberSet}
      />
    </main>
  );
}
