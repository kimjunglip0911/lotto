'use client';

import { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { AccuMain } from './components/AccuMain';
import { useAccData } from './hooks/useAccData';
import { useAccView } from './hooks/useAccView';

// "누적 번호 분석" 화면 전체를 조립하는 파일입니다.
// 데이터는 useAccData, 화면에 맞게 가공한 값은 useAccView에서 받아 본문(AccuMain)에 넘깁니다.

export default function AccumulatedNumbersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const data = useAccData();
  const view = useAccView({
    availableDraws: data.availableDraws,
    selectedDraw: data.selectedDraw,
    isLoadingDraws: data.isLoadingDraws,
    drawLoadError: data.drawLoadError,
    isSearching: data.isSearching,
    searchError: data.searchError,
    searchedDraw: data.searchedDraw,
    selectedWinningNumber: data.selectedWinningNumber,
    windowCountResultMap: data.windowCountResultMap,
    strategyCharts: data.strategyCharts,
    finalNumberPlan: data.finalNumberPlan,
  });

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <AccuMain data={data} view={view} />
      </div>
    </div>
  );
}
