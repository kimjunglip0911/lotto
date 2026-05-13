'use client';

import { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { StreakMain } from './components/StreakMain';
import { useStData } from './hooks/useStData';
import { useStView } from './hooks/useStView';

// "연속 출현 분석" 화면 전체를 조립하는 파일입니다.
// 데이터·파생 상태를 두 훅(useStData, useStView)에서 받아
// 검색·요약·표 세 묶음으로 본문 조립 컴포넌트(StreakMain)에 넘겨 줍니다.

export default function RunStreakPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const data = useStData();
  const derived = useStView(data);

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <StreakMain
          search={{
            availableDraws: data.availableDraws,
            selectedDraw: data.selectedDraw,
            setSelectedDraw: data.setSelectedDraw,
            isLoadingDraws: data.isLoadingDraws,
            isSearching: data.isSearching,
            handleSearch: () => void data.handleSearch(),
            isLoadingWinningNumber: data.isLoadingWinningNumber,
            winningNumberError: data.winningNumberError,
            selectedWinningNumber: data.selectedWinningNumber,
            statusMessage: derived.statusMessage,
          }}
          summary={{
            canShowStreakPanels: derived.canShowStreakPanels,
            analyzedDrawCount: data.analyzedDrawCount,
            maxStreak: derived.maxStreak,
            averageStreak: data.averageStreak,
            coldNumbers: derived.coldNumbers,
          }}
          table={{
            hasSearched: derived.hasSearched,
            noHistory: derived.noHistory,
            isSearching: data.isSearching,
            searchError: data.searchError,
            streakResults: data.streakResults,
          }}
        />
      </div>
    </div>
  );
}
