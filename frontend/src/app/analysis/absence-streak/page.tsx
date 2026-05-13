'use client';

import { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { AbsenceStreakBody } from './components/AbsenceStreakBody';
import { useAbsenceStreakData } from './hooks/useAbsenceStreakData';
import { useAbsenceStreakDerived } from './hooks/useAbsenceStreakDerived';

// "연속 미출현 분석" 화면 전체를 조립하는 파일입니다.
// 데이터·파생 상태를 두 훅에서 받아 본문 조립 컴포넌트(AbsenceStreakBody)에 넘겨 줍니다.

export default function AbsenceStreakPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const data = useAbsenceStreakData();
  const derived = useAbsenceStreakDerived(data);

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <AbsenceStreakBody
          availableDraws={data.availableDraws}
          selectedDraw={data.selectedDraw}
          setSelectedDraw={data.setSelectedDraw}
          isLoadingDraws={data.isLoadingDraws}
          isSearching={data.isSearching}
          handleSearch={() => void data.handleSearch()}
          isLoadingWinningNumber={data.isLoadingWinningNumber}
          winningNumberError={data.winningNumberError}
          selectedWinningNumber={data.selectedWinningNumber}
          statusMessage={derived.statusMessage}
          canShowStreakPanels={derived.canShowStreakPanels}
          analyzedDrawCount={data.analyzedDrawCount}
          maxStreak={derived.maxStreak}
          averageStreak={data.averageStreak}
          top5PctThreshold={data.top5PctThreshold}
          coldNumbers={derived.coldNumbers}
          hasSearched={derived.hasSearched}
          noHistory={derived.noHistory}
          searchError={data.searchError}
          streakResults={data.streakResults}
          selectedWinningNumberSet={derived.selectedWinningNumberSet}
        />
      </div>
    </div>
  );
}
