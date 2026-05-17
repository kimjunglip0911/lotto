'use client';

import React, { useMemo, useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { AdoptedSummaryCard } from './components/AdoptedSummaryCard';
import { ComprehensiveChart } from './components/ComprehensiveChart';
import { SearchPanel } from './components/SearchPanel';
import { AccumulatedExclusionCard } from './components/AccumulatedExclusionCard';
import { SourceNumbersCard } from './components/SourceNumbersCard';
import {
  CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_OVERLAP_ROUNDS,
  CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_PCT_NUMERATOR,
} from '@/app/analysis/chi-square/constants';
import { useFinalPickData } from './hooks/useFinalPickData';
import { extractMainNumbers } from './types';

const ADOPTED_TARGET_COUNT = 18;
export default function FinalPickPage() {
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
    isSearching,
    searchError,
    handleSearch,
    excludedByStreakNumbers,
    accumulatedExclusion,
    adoptedByChiSquareNumbers,
    excludedByChiSquareWalkForwardConditionalPct,
    excludedByChiSquareWalkForwardOverlapRounds,
    comprehensiveChartCounts,
    comprehensiveChartAnalyzedDrawCount,
  } = useFinalPickData();

  /** 본번호 6개만 추출(보너스 제외) — 패널/차트 hit 강조용. */
  const selectedMainNumbers = useMemo(
    () => (selectedWinningNumber ? extractMainNumbers(selectedWinningNumber) : []),
    [selectedWinningNumber],
  );
  const mainWinningNumberSet = useMemo(
    () => new Set(selectedMainNumbers),
    [selectedMainNumbers],
  );

  const adoptedAllNumbers = useMemo(
    () => [...adoptedByChiSquareNumbers].sort((a, b) => a - b),
    [adoptedByChiSquareNumbers],
  );

  const adoptedSummaryTargetCount =
    adoptedAllNumbers.length > 0 ? adoptedAllNumbers.length : ADOPTED_TARGET_COUNT;

  /** 차트 빨간 동그라미 — 워크포워드 제외(두 카드 합집합). */
  const chiSquareWalkForwardExcludedForChart = useMemo(
    () =>
      [
        ...new Set([
          ...excludedByChiSquareWalkForwardConditionalPct,
          ...excludedByChiSquareWalkForwardOverlapRounds,
        ]),
      ].sort((a, b) => a - b),
    [excludedByChiSquareWalkForwardConditionalPct, excludedByChiSquareWalkForwardOverlapRounds],
  );

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
            onSearch={() => void handleSearch()}
            isLoadingDraws={isLoadingDraws}
            isSearching={isSearching}
            isLoadingWinningNumber={isLoadingWinningNumber}
            winningNumberError={winningNumberError}
            selectedWinningNumber={selectedWinningNumber}
            selectedMainNumbers={selectedMainNumbers}
            searchError={searchError ?? drawLoadError}
          />

          <AdoptedSummaryCard
            numbers={adoptedAllNumbers}
            targetCount={adoptedSummaryTargetCount}
            mainWinningSet={mainWinningNumberSet}
          />

          <ComprehensiveChart
            counts={comprehensiveChartCounts}
            analyzedDrawCountForChart={comprehensiveChartAnalyzedDrawCount}
            highlightedNumbers={mainWinningNumberSet}
            accumulatedExcludedNumbers={accumulatedExclusion.excludedUnique}
            chiSquareWalkForwardExcludedNumbers={chiSquareWalkForwardExcludedForChart}
            streakExcludedNumbers={excludedByStreakNumbers}
          />

          <SourceNumbersCard
            title="연속 미출현 분석 — 후보 제외"
            description="직전 회차에서 끝난 연속 출현(본번호 2회 이상)에 해당하면 후보에서 제외"
            tone="exclude"
            numbers={excludedByStreakNumbers}
            mainWinningSet={mainWinningNumberSet}
          />

          <AccumulatedExclusionCard exclusion={accumulatedExclusion} mainWinningSet={mainWinningNumberSet} />

          <SourceNumbersCard
            title="카이제곱 검정 — 제외(조건부 확률)"
            titleHint={`조건부 확률 ${CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_PCT_NUMERATOR}% 이하`}
            tone="exclude"
            numbers={excludedByChiSquareWalkForwardConditionalPct}
            mainWinningSet={mainWinningNumberSet}
          />

          <SourceNumbersCard
            title="카이제곱 검정 — 제외(겹침 회차)"
            titleHint={`구간 출현 중 당첨 본번호 겹침 ${CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_OVERLAP_ROUNDS}회 이하`}
            tone="exclude"
            numbers={excludedByChiSquareWalkForwardOverlapRounds}
            mainWinningSet={mainWinningNumberSet}
          />
        </main>
      </div>
    </div>
  );
}
