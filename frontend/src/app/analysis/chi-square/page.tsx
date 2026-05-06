'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { DeviationChart } from './components/DeviationChart';
import { FrequencySummary } from './components/FrequencySummary';
import { RelPctBinWalkForwardTable } from './components/RelPctBinWalkForwardTable';
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
    accumulatedFinalNumbers,
    walkForwardRows,
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
    adoptedUsageNumbers,
    adoptedUsageNumberSet,
    statusMessage,
    chiSquareThreshold,
    relPctBinWalkForwardPresentation,
  } = useChiSquareDerived({
    analyzedDrawCount,
    chiSquareResults,
    walkForwardRows,
    accumulatedFinalNumbers,
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
            />
          )}

          {hasSearched &&
            !noHistory &&
            !isSearching &&
            !searchError &&
            relPctBinWalkForwardPresentation !== null && (
              <RelPctBinWalkForwardTable
                denominator={relPctBinWalkForwardPresentation.denominator}
                negBins={relPctBinWalkForwardPresentation.negBins}
                posBins={relPctBinWalkForwardPresentation.posBins}
              />
            )}

          {hasSearched && !noHistory && !isSearching && !searchError && adoptedUsageNumbers && (
            <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
              {accumulatedFinalNumbers && accumulatedFinalNumbers.length === 4 && (
                <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-3 space-y-2">
                  <p className="text-sm font-semibold text-sky-200">누적번호 분석 최종 4개</p>
                  <div className="flex flex-wrap gap-2">
                    {accumulatedFinalNumbers.map((n) => (
                      <span
                        key={`accum-final-${n}`}
                        className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-sky-400/25 px-2 text-sm font-bold text-sky-100"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-sky-100/85 leading-relaxed">
                    누적번호 분석 페이지와 동일한 전략·집계로 조회 시점에 계산된 최종 채택 번호입니다.
                  </p>
                </div>
              )}
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 space-y-2">
                <p className="text-sm font-semibold text-emerald-300">사용 번호 4개 (편차 순 이어서)</p>
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
                  편차(O−E) 값이 가장 작은(가장 음수에 가까운) 4개 번호와 누적번호 분석 최종 4개(있을 때)는 제외합니다. 사용 번호 4개는 전체를 편차 오름차순으로 한 줄 세운 뒤, 제외분을 건너뛰고 그다음 순서에서 4개를 고릅니다(예: −30~−26 제외 후 −25부터). 동률이면 번호가 작은 쪽을 먼저 둡니다.
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
          />

          {hasSearched && !noHistory && !isSearching && !searchError && chiSquareResults.length > 0 && (
            <FrequencySummary lowFreqNumbers={lowFreqNumbers} highFreqNumbers={highFreqNumbers} />
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
            selectedWinningNumberSet={selectedWinningNumberSet}
            adoptedUsageNumberSet={adoptedUsageNumberSet}
          />

          <StatisticalNote />

        </main>
      </div>
    </div>
  );
}
