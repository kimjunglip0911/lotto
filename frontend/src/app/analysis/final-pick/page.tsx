'use client';

import React, { useMemo, useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { AdoptedSummaryCard } from './components/AdoptedSummaryCard';
import { ComprehensiveChart } from './components/ComprehensiveChart';
import { SearchPanel } from './components/SearchPanel';
import { SourceNumbersCard } from './components/SourceNumbersCard';
import { useFinalPickData } from './hooks/useFinalPickData';
import { extractMainNumbers } from './types';

const ADOPTED_TARGET_COUNT = 18;
const ACCUMULATED_TARGET_COUNT = 8;
const CHI_SQUARE_TARGET_COUNT = 10;

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
    excludedByTrendNumbers,
    excludedByStreakNumbers,
    adoptedByAccumulatedNumbers,
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

  // 후속: 나머지 분석 기법의 실제 결과를 채울 placeholder 자리.
  const adoptedAllNumbers: number[] = [];
  const adoptedByChiSquareNumbers: number[] = [];
  const comprehensiveCounts: number[] | null = null;

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
            targetCount={ADOPTED_TARGET_COUNT}
            mainWinningSet={mainWinningNumberSet}
          />

          <ComprehensiveChart
            counts={comprehensiveCounts}
            highlightedNumbers={mainWinningNumberSet}
          />

          <SourceNumbersCard
            title="연속 미출현 분석 — 후보 제외"
            description="직전 회차에서 끝난 연속 출현(본번호 2회 이상)에 해당하면 후보에서 제외"
            tone="exclude"
            numbers={excludedByStreakNumbers}
            mainWinningSet={mainWinningNumberSet}
          />

          <SourceNumbersCard
            title="추세 분석 — 후보 제외"
            description="기댓값 대비 EMA 편차 구간 출현확률이 20.00% 이하인 번호 제외 (20.01% 이상은 제외 아님)"
            tone="exclude"
            numbers={excludedByTrendNumbers}
            mainWinningSet={mainWinningNumberSet}
          />

          <SourceNumbersCard
            title="누적 번호 분석 — 채택"
            description="누적 출현 분포 기반 채택 번호"
            tone="adoptAccumulated"
            numbers={adoptedByAccumulatedNumbers}
            targetCount={ACCUMULATED_TARGET_COUNT}
            mainWinningSet={mainWinningNumberSet}
          />

          <SourceNumbersCard
            title="카이제곱 검정 — 채택"
            description="구간 조건부 확률 통합 순위 기반 채택 번호"
            tone="adoptChiSquare"
            numbers={adoptedByChiSquareNumbers}
            targetCount={CHI_SQUARE_TARGET_COUNT}
            mainWinningSet={mainWinningNumberSet}
          />
        </main>
      </div>
    </div>
  );
}
