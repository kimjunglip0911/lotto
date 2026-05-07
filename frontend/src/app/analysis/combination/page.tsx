'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { OddEvenProbabilityTable } from './components/OddEvenProbabilityTable';
import { useOddEvenProbabilityData } from './hooks/useOddEvenProbabilityData';

export default function CombinationAnalysisPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isLoading, loadError, totalDraws, distributionRows } = useOddEvenProbabilityData();

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
          {isLoading && <p className="text-sm text-slate-300">데이터를 불러오는 중...</p>}
          {!isLoading && loadError && <p className="text-sm text-rose-300">{loadError}</p>}
          {!isLoading && !loadError && (
            <OddEvenProbabilityTable totalDraws={totalDraws} rows={distributionRows} />
          )}
        </main>
      </div>
    </div>
  );
}
