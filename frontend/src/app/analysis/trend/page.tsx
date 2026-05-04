'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { PhaseCards } from './components/PhaseCards';
import { TrendRecommendedStrip } from './components/TrendRecommendedStrip';
import { SearchControls } from './components/SearchControls';
import { StatisticalNote } from './components/StatisticalNote';
import { SummaryCards } from './components/SummaryCards';
import { TrendChart } from './components/TrendChart';
import { TrendResultTable } from './components/TrendResultTable';
import { useTrendData } from './hooks/useTrendData';
import { useTrendDerived } from './hooks/useTrendDerived';

export default function TrendPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {
    availableDraws,
    selectedDraw,
    setSelectedDraw,
    isLoadingDraws,
    drawLoadError,
    selectedWinningNumber,
    isLoadingWinningNumber,
    winningNumberError,
    searchedDraw,
    isSearching,
    searchError,
    trendResults,
    historyCount,
    accumulatedFinalFour,
    chiSquareAdoptedFour,
    handleSearch,
  } = useTrendData();

  const {
    hasSearched,
    noHistory,
    hasResults,
    selectedMainNumbers,
    selectedWinningNumberSet,
    phaseGroups,
    maxRate,
    chartTotalW,
    baselineY,
    statusMessage,
    baseline,
    kConfig,
    chartHeight,
    chartPaddingTop,
    chartPaddingBottom,
    chartWidthPerNum,
    trendRecommendedFour,
  } = useTrendDerived({
    trendResults,
    selectedWinningNumber,
    searchedDraw,
    isLoadingDraws,
    drawLoadError,
    availableDraws,
    isSearching,
    selectedDraw,
    searchError,
    accumulatedFinalFour,
    chiSquareAdoptedFour,
  });

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
          <SearchControls
            selectedDraw={selectedDraw}
            onChangeSelectedDraw={setSelectedDraw}
            availableDraws={availableDraws}
            isLoadingDraws={isLoadingDraws}
            isSearching={isSearching}
            onSearch={() => void handleSearch()}
            isLoadingWinningNumber={isLoadingWinningNumber}
            winningNumberError={winningNumberError}
            selectedWinningNumber={selectedWinningNumber}
            selectedMainNumbers={selectedMainNumbers}
            statusMessage={statusMessage}
          />

          {hasSearched && !noHistory && !isSearching && !searchError && hasResults && (
            <SummaryCards historyCount={historyCount} baseline={baseline} kConfig={kConfig} />
          )}

          <TrendChart
            noHistory={noHistory}
            hasSearched={hasSearched}
            isSearching={isSearching}
            searchError={searchError}
            hasResults={hasResults}
            trendResults={trendResults}
            selectedWinningNumberSet={selectedWinningNumberSet}
            chartTotalW={chartTotalW}
            chartHeight={chartHeight}
            chartPaddingTop={chartPaddingTop}
            chartPaddingBottom={chartPaddingBottom}
            chartWidthPerNum={chartWidthPerNum}
            maxRate={maxRate}
            baselineY={baselineY}
            baseline={baseline}
            kConfig={kConfig}
          />

          {hasSearched && !noHistory && !isSearching && !searchError && hasResults && (
            <PhaseCards phaseGroups={phaseGroups} />
          )}

          {hasSearched && !noHistory && !isSearching && !searchError && hasResults && (
            <TrendRecommendedStrip trendRecommendedFour={trendRecommendedFour} />
          )}

          <TrendResultTable
            noHistory={noHistory}
            hasSearched={hasSearched}
            isSearching={isSearching}
            searchError={searchError}
            hasResults={hasResults}
            trendResults={trendResults}
            selectedWinningNumberSet={selectedWinningNumberSet}
          />

          <StatisticalNote baseline={baseline} kConfig={kConfig} />

        </main>
      </div>
    </div>
  );
}
