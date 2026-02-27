'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { LotteryGrid } from '@/components/page-specific/home/LotteryGrid';
import { AlgorithmInfo } from '@/components/page-specific/home/AlgorithmInfo';
import { WinningStats } from '@/components/page-specific/home/WinningStats';

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-8 px-4 pt-4 space-y-8">
          <LotteryGrid />
          <AlgorithmInfo />
          <WinningStats />
        </main>
      </div>
    </div>
  );
}
