import React from 'react';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { LotteryGrid } from '@/components/page-specific/home/LotteryGrid';
import { AlgorithmInfo } from '@/components/page-specific/home/AlgorithmInfo';
import { WinningStats } from '@/components/page-specific/home/WinningStats';
import { EliteMembers } from '@/components/page-specific/home/EliteMembers';

export default function Home() {
  return (
    <div className="bg-background min-h-screen flex justify-center w-full">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[90%] 2xl:w-[85%] max-w-[1600px] border-x border-card-border/30 relative shadow-2xl">
        <Header />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-8">
          <LotteryGrid />
          <AlgorithmInfo />
          <WinningStats />
          <EliteMembers />
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
