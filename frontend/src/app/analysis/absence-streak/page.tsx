'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { ColdNumbersSection } from './components/ColdNumbersSection';
import { SearchControls } from './components/SearchControls';
import { StatisticalNote } from './components/StatisticalNote';
import { StreakChart } from './components/StreakChart';
import { StreakTable } from './components/StreakTable';
import { SummaryCards } from './components/SummaryCards';
import { useAbsenceStreakData } from './hooks/useAbsenceStreakData';
import { useAbsenceStreakDerived } from './hooks/useAbsenceStreakDerived';

export default function AbsenceStreakPage() {
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
    streakResults,
    averageStreak,
    top5PctThreshold,
    handleSearch,
  } = useAbsenceStreakData();

  const {
    hasSearched,
    noHistory,
    selectedWinningNumberSet,
    maxStreak,
    coldNumbers,
    canShowStreakPanels,
    statusMessage,
  } = useAbsenceStreakDerived({
    availableDraws,
    selectedDraw,
    isLoadingDraws,
    drawLoadError,
    selectedWinningNumber,
    searchedDraw,
    isSearching,
    searchError,
    streakResults,
  });

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
          <SearchControls
            availableDraws={availableDraws}
            selectedDraw={selectedDraw}
            onSelectedDrawChange={setSelectedDraw}
            isLoadingDraws={isLoadingDraws}
            isSearching={isSearching}
            handleSearch={() => void handleSearch()}
            isLoadingWinningNumber={isLoadingWinningNumber}
            winningNumberError={winningNumberError}
            selectedWinningNumber={selectedWinningNumber}
            statusMessage={statusMessage}
          />

          {canShowStreakPanels && (
            <SummaryCards
              analyzedDrawCount={analyzedDrawCount}
              maxStreak={maxStreak}
              averageStreak={averageStreak}
              top5PctThreshold={top5PctThreshold}
              coldNumbersCount={coldNumbers.length}
            />
          )}

          <StreakChart
            hasSearched={hasSearched}
            noHistory={noHistory}
            isSearching={isSearching}
            searchError={searchError}
            streakResults={streakResults}
            maxStreak={maxStreak}
            top5PctThreshold={top5PctThreshold}
            selectedWinningNumberSet={selectedWinningNumberSet}
          />

          {canShowStreakPanels && <ColdNumbersSection coldNumbers={coldNumbers} averageStreak={averageStreak} />}

          <StreakTable
            hasSearched={hasSearched}
            noHistory={noHistory}
            isSearching={isSearching}
            searchError={searchError}
            streakResults={streakResults}
          />

          <StatisticalNote />
        </main>
      </div>
    </div>
  );
}
