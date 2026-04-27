'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { DeviationChart } from './components/DeviationChart';
import { FrequencySummary } from './components/FrequencySummary';
import { ResultTable } from './components/ResultTable';
import { SearchControls } from './components/SearchControls';
import { StatisticalNote } from './components/StatisticalNote';
import { SummaryCards } from './components/SummaryCards';
import { useChiSquareData } from './hooks/useChiSquareData';
import { useChiSquareDerived } from './hooks/useChiSquareDerived';

export default function ChiSquarePage() {
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
    analyzedDrawCount,
    chiSquareResults,
    handleSearch,
  } = useChiSquareData();

  const {
    hasSearched,
    noHistory,
    expected,
    lowFreqNumbers,
    highFreqNumbers,
    selectedMainNumbers,
    selectedWinningNumberSet,
    maxAbsDeviation,
    top5PctThreshold,
    avgLinePx,
    excludedNumbers,
    statusMessage,
    chiSquareThreshold,
  } = useChiSquareDerived({
    analyzedDrawCount,
    chiSquareResults,
    selectedWinningNumber,
    searchedDraw,
    isLoadingDraws,
    drawLoadError,
    availableDraws,
    isSearching,
    selectedDraw,
    searchError,
  });

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
          <SearchControls
            selectedDraw={selectedDraw}
            onSelectedDrawChange={setSelectedDraw}
            onSearch={() => {
              void handleSearch();
            }}
            isLoadingDraws={isLoadingDraws}
            availableDraws={availableDraws}
            isSearching={isSearching}
            isLoadingWinningNumber={isLoadingWinningNumber}
            winningNumberError={winningNumberError}
            selectedWinningNumber={selectedWinningNumber}
            selectedMainNumbers={selectedMainNumbers}
            statusMessage={statusMessage}
          />

          {hasSearched && !noHistory && !isSearching && !searchError && chiSquareResults.length > 0 && (
            <SummaryCards
              analyzedDrawCount={analyzedDrawCount}
              expected={expected}
              chiSquareThreshold={chiSquareThreshold}
              top5PctThreshold={top5PctThreshold}
              excludedCount={excludedNumbers.length}
            />
          )}

          <DeviationChart
            hasSearched={hasSearched}
            noHistory={noHistory}
            isSearching={isSearching}
            searchError={searchError}
            chiSquareResults={chiSquareResults}
            selectedWinningNumberSet={selectedWinningNumberSet}
            maxAbsDeviation={maxAbsDeviation}
            top5PctThreshold={top5PctThreshold}
            avgLinePx={avgLinePx}
          />

          {hasSearched && !noHistory && !isSearching && !searchError && chiSquareResults.length > 0 && (
            <FrequencySummary
              lowFreqNumbers={lowFreqNumbers}
              highFreqNumbers={highFreqNumbers}
              excludedNumbers={excludedNumbers}
            />
          )}

          <ResultTable
            hasSearched={hasSearched}
            noHistory={noHistory}
            isSearching={isSearching}
            searchError={searchError}
            chiSquareResults={chiSquareResults}
            expected={expected}
            analyzedDrawCount={analyzedDrawCount}
            chiSquareThreshold={chiSquareThreshold}
            top5PctThreshold={top5PctThreshold}
            selectedWinningNumberSet={selectedWinningNumberSet}
          />

          <StatisticalNote />

        </main>
      </div>
    </div>
  );
}
