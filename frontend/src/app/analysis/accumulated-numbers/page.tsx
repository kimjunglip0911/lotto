'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { AccumulatedChartSection } from './components/AccumulatedChartSection';
import { SearchPanel } from './components/SearchPanel';
import { useAccumulatedNumbersData } from './hooks/useAccumulatedNumbersData';

export default function AccumulatedNumbersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {
    availableDraws,
    selectedDraw,
    setSelectedDraw,
    searchedDraw,
    isLoadingDraws,
    drawLoadError,
    isSearching,
    searchError,
    selectedWinningNumber,
    isLoadingSelectedWinningNumber,
    selectedWinningNumberError,
    allTimeCountResult,
    windowCharts,
    handleSearch,
  } = useAccumulatedNumbersData();

  const hasSearched = searchedDraw !== '';
  const selectedSearchDrawNo = Number(searchedDraw);
  const selectedMainNumbers = selectedWinningNumber
    ? [
        selectedWinningNumber.num1,
        selectedWinningNumber.num2,
        selectedWinningNumber.num3,
        selectedWinningNumber.num4,
        selectedWinningNumber.num5,
        selectedWinningNumber.num6,
      ]
    : [];
  const selectedHighlightNumbers = selectedWinningNumber
    ? new Set([...selectedMainNumbers, selectedWinningNumber.bonus_num])
    : null;
  const statusMessage = isLoadingDraws
    ? '회차 정보를 불러오는 중입니다.'
    : drawLoadError
      ? `${drawLoadError} 잠시 후 다시 시도해 주세요.`
      : availableDraws.length === 0
        ? '조회 가능한 회차 정보가 없습니다.'
        : isSearching
          ? `${selectedDraw}회 기준 누적 당첨번호를 집계하고 있습니다.`
          : searchError
            ? `${searchError} 잠시 후 다시 시도해 주세요.`
            : searchedDraw
              ? null
              : '회차를 선택한 뒤 조회 버튼을 누르면 해당 회차 기준 분석을 시작합니다.';

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
          <SearchPanel
            availableDraws={availableDraws}
            selectedDraw={selectedDraw}
            onSelectedDrawChange={setSelectedDraw}
            onSearch={handleSearch}
            isLoadingDraws={isLoadingDraws}
            isSearching={isSearching}
            isLoadingSelectedWinningNumber={isLoadingSelectedWinningNumber}
            selectedWinningNumberError={selectedWinningNumberError}
            selectedWinningNumber={selectedWinningNumber}
          />
          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
            {statusMessage && <p className="text-slate-300 text-sm leading-relaxed">{statusMessage}</p>}
          </section>

          <AccumulatedChartSection
            title="번호별 누적 출현 횟수"
            counts={allTimeCountResult.counts}
            analyzedDrawCountForChart={allTimeCountResult.analyzedDrawCount}
            noDataMessage="저장된 당첨번호 기준으로 집계 가능한 이전 회차 데이터가 없습니다."
            hasSearched={hasSearched}
            selectedSearchDrawNo={selectedSearchDrawNo}
            isSearching={isSearching}
            searchError={searchError}
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
              isSearching={isSearching}
              searchError={searchError}
              selectedHighlightNumbers={selectedHighlightNumbers}
            />
          ))}
        </main>
      </div>
    </div>
  );
}
