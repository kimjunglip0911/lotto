'use client';

import { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useEqualData } from './hooks/useEqualData';
import { EqualMain } from './ui/EqualMain';

/** 균등 분석: 최근 6회차 출현 횟수 버킷 화면. */
export default function EqualPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const data = useEqualData();

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <EqualMain {...data} />
      </div>
    </div>
  );
}
