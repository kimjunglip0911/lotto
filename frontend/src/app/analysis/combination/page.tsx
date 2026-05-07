'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { ConsecutiveNumberTable } from './components/ConsecutiveNumberTable';
import { OddEvenProbabilityTable } from './components/OddEvenProbabilityTable';
import { PositionBandProbabilityTable } from './components/PositionBandProbabilityTable';
import { useCombinationAnalysisData } from './hooks/useCombinationAnalysisData';

export default function CombinationAnalysisPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isLoading, loadError, totalDraws, oddEvenRows, consecutiveRows, positionBandRows } =
    useCombinationAnalysisData();

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
          {isLoading && <p className="text-sm text-slate-300">데이터를 불러오는 중...</p>}
          {!isLoading && loadError && <p className="text-sm text-rose-300">{loadError}</p>}
          {!isLoading && !loadError && (
            <>
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="flex-1 min-w-0">
                  <OddEvenProbabilityTable totalDraws={totalDraws} rows={oddEvenRows} />
                </div>
                <ConsecutiveNumberTable totalDraws={totalDraws} rows={consecutiveRows} />
              </div>
              <PositionBandProbabilityTable totalDraws={totalDraws} rows={positionBandRows} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
