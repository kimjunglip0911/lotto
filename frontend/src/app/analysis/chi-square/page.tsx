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
    adoptedUsageNumbers,
    adoptedUsageNumberSet,
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

          {hasSearched && !noHistory && !isSearching && !searchError && adoptedUsageNumbers && (
            <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 space-y-2">
                <p className="text-sm font-semibold text-emerald-300">사용 번호 4개 (저빈도 순)</p>
                <div className="flex flex-wrap gap-2">
                  {adoptedUsageNumbers.map((n) => (
                    <span
                      key={`adopted-${n}`}
                      className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-emerald-400/25 px-2 text-sm font-bold text-emerald-200"
                    >
                      {n}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  기준 회차 이전까지 집계한 출현 횟수(O)가 가장 적은 순으로 4개입니다. 동률이면 번호가 작은 쪽을 먼저 두고, 이미 뽑힌 번호와 겹치면 다음 순위로 채웁니다.
                </p>
              </div>
            </section>
          )}

          <DeviationChart
            hasSearched={hasSearched}
            noHistory={noHistory}
            isSearching={isSearching}
            searchError={searchError}
            chiSquareResults={chiSquareResults}
            selectedWinningNumberSet={selectedWinningNumberSet}
            adoptedUsageNumberSet={adoptedUsageNumberSet}
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
            adoptedUsageNumberSet={adoptedUsageNumberSet}
          />

          <StatisticalNote />

        </main>
      </div>
    </div>
  );
}
