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
    chiSquareChartData,
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
            chartData={chiSquareChartData}
            highlightedNumbers={mainWinningNumberSet}
            accumulatedExcludedNumbers={accumulatedExclusion.excludedUnique}
            chiSquareAdoptedNumbers={adoptedByChiSquareNumbers}
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
            description={`구간이 나온 회차 대비 조회 당첨 본번호와 겹친 비율이 ${CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_PCT_NUMERATOR}% 이하인 경우 (${CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_PCT_NUMERATOR}.01% 초과는 제외 아님). 통합 채택은 잔여 번호에 누적·연속 규칙을 적용합니다.`}
            tone="exclude"
            numbers={excludedByChiSquareWalkForwardConditionalPct}
            mainWinningSet={mainWinningNumberSet}
          />

          <SourceNumbersCard
            title="카이제곱 검정 — 제외(겹침 회차)"
            description={`구간이 나온 회차 중 조회 당첨 본번호와 겹친 회차 수가 ${CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_OVERLAP_ROUNDS}회 이하인 경우 (${CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_OVERLAP_ROUNDS + 1}회 초과는 이 조건으로 제외 아님). 동일 번호가 위 조건부 확률 제외에도 해당하면 두 카드에 모두 표시됩니다.`}
            tone="exclude"
            numbers={excludedByChiSquareWalkForwardOverlapRounds}
            mainWinningSet={mainWinningNumberSet}
          />
        </main>
      </div>
    </div>
  );
}
