'use client';

import { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { useStData } from './hooks/useStData';
import { useStView } from './hooks/useStView';
import { StreakMain } from './ui/StreakMain';

export default function RunStreakPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const data = useStData();
  const view = useStView({
    availableDraws: data.availableDraws,
    selectedDraw: data.selectedDraw,
    isLoadingDraws: data.isLoadingDraws,
    drawLoadError: data.drawLoadError,
    searchedDraw: data.searchedDraw,
    isSearching: data.isSearching,
    searchError: data.searchError,
    streakResults: data.streakResults,
  });

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <StreakMain data={data} view={view} />
      </div>
    </div>
  );
}
