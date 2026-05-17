'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { DeviationChart } from './components/DeviationChart';
import { RelPctBinWalkForwardTable } from './components/RelPctBinWalkForwardTable';
import { ResultTable } from './components/ResultTable';
import { SearchControls } from './components/SearchControls';
import { StatisticalNote } from './components/StatisticalNote';
import { SummaryCards } from './components/SummaryCards';
import {
  CHI_SQUARE_DEVIATION_BIN_WIDTH,
  CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_OVERLAP_ROUNDS,
  CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_PCT_NUMERATOR,
} from './constants';
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
    walkForwardRows,
    handleSearch,
  } = useChiSquareData();

  const {
    hasSearched,
    noHistory,
    expected,
    selectedMainNumbers,
    selectedWinningNumberSet,
    maxAbsDeviation,
    walkForwardExcludedSplit,
    walkForwardExcludedNumberSet,
    statusMessage,
    chiSquareThreshold,
    relPctBinWalkForwardPresentation,
  } = useChiSquareDerived({
    analyzedDrawCount,
    chiSquareResults,
    walkForwardRows,
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
                targetRoundCount={relPctBinWalkForwardPresentation.targetRoundCount}
                negBins={relPctBinWalkForwardPresentation.negBins}
                posBins={relPctBinWalkForwardPresentation.posBins}
              />
            )}

          {hasSearched && !noHistory && !isSearching && !searchError && walkForwardExcludedSplit != null && (
            <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
              <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 space-y-4">
                <p className="text-sm font-semibold text-rose-200">워크포워드 후보 제외(사유별)</p>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-rose-100/95">
                    조건부 확률 {CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_PCT_NUMERATOR}% 이하 —{' '}
                    {walkForwardExcludedSplit.byConditionalPct.length}개
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {walkForwardExcludedSplit.byConditionalPct.map((n) => (
                      <span
                        key={`wf-ex-pct-${n}`}
                        className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-rose-400/25 px-2 text-sm font-bold text-rose-100"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 border-t border-rose-400/20 pt-3">
                  <p className="text-xs font-medium text-rose-100/95">
                    겹침 회차 {CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_OVERLAP_ROUNDS}회 이하 —{' '}
                    {walkForwardExcludedSplit.byOverlapRounds.length}개
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {walkForwardExcludedSplit.byOverlapRounds.map((n) => (
                      <span
                        key={`wf-ex-ov-${n}`}
                        className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-rose-400/20 px-2 text-sm font-bold text-rose-50"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-rose-100/85 leading-relaxed">
                  편차(O−E) 워크포워드 표와 동일한 집계(조회 회차 직전까지 전체 기간, 구간 폭 {CHI_SQUARE_DEVIATION_BIN_WIDTH})입니다. 한 번호가 두 조건을 모두 만족하면 두 목록에 모두 나옵니다. 조회 시점 각 번호의 편차(O−E)는 검정 결과 표와 같이 전체 누적 기준입니다.
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
            walkForwardExcludedNumberSet={walkForwardExcludedNumberSet}
            maxAbsDeviation={maxAbsDeviation}
          />

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
            walkForwardExcludedNumberSet={walkForwardExcludedNumberSet}
          />

          <StatisticalNote />

        </main>
      </div>
    </div>
  );
}
