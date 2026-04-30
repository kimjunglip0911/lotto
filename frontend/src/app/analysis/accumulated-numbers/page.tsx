'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { AccumulatedChartSection } from './components/AccumulatedChartSection';
import { SearchPanel } from './components/SearchPanel';
import { useAccumulatedNumbersData } from './hooks/useAccumulatedNumbersData';
import { useAccumulatedNumbersDerived } from './hooks/useAccumulatedNumbersDerived';

export default function AccumulatedNumbersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const data = useAccumulatedNumbersData();
  const {
    hasSearched,
    selectedSearchDrawNo,
    selectedMainNumbers,
    selectedHighlightNumbers,
    statusMessage,
    windowCharts,
  } = useAccumulatedNumbersDerived({
    availableDraws: data.availableDraws,
    selectedDraw: data.selectedDraw,
    isLoadingDraws: data.isLoadingDraws,
    drawLoadError: data.drawLoadError,
    isSearching: data.isSearching,
    searchError: data.searchError,
    searchedDraw: data.searchedDraw,
    selectedWinningNumber: data.selectedWinningNumber,
    windowCountResultMap: data.windowCountResultMap,
  });

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
          <SearchPanel
            availableDraws={data.availableDraws}
            selectedDraw={data.selectedDraw}
            onSelectedDrawChange={data.setSelectedDraw}
            onSearch={data.handleSearch}
            isLoadingDraws={data.isLoadingDraws}
            isSearching={data.isSearching}
            isLoadingSelectedWinningNumber={data.isLoadingSelectedWinningNumber}
            selectedWinningNumberError={data.selectedWinningNumberError}
            selectedWinningNumber={data.selectedWinningNumber}
            selectedMainNumbers={selectedMainNumbers}
          />
          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
            {statusMessage && <p className="text-slate-300 text-sm leading-relaxed">{statusMessage}</p>}
          </section>

          <AccumulatedChartSection
            title="번호별 누적 출현 횟수"
            counts={data.allTimeCountResult.counts}
            analyzedDrawCountForChart={data.allTimeCountResult.analyzedDrawCount}
            noDataMessage="저장된 당첨번호 기준으로 집계 가능한 이전 회차 데이터가 없습니다."
            hasSearched={hasSearched}
            selectedSearchDrawNo={selectedSearchDrawNo}
            isSearching={data.isSearching}
            searchError={data.searchError}
            selectedHighlightNumbers={selectedHighlightNumbers}
          />

          {windowCharts.map((chart) => (
            <AccumulatedChartSection
              key={chart.key}
              title={chart.title}
              counts={chart.counts}
              analyzedDrawCountForChart={chart.analyzedDrawCount}
              noDataMessage={chart.noDataMessage}
              hasSearched={hasSearched}
              selectedSearchDrawNo={selectedSearchDrawNo}
              isSearching={data.isSearching}
              searchError={data.searchError}
              selectedHighlightNumbers={selectedHighlightNumbers}
            />
          ))}
        </main>
      </div>
    </div>
  );
}
