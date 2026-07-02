'use client';

import { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useGapData } from './hooks/useGapData';
import { IntervalMain } from './ui/IntervalMain';

// "번호별 간격" 화면: 공통 레이아웃과 데이터 훅을 조립해 본문에 넘깁니다.

export default function IntervalPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const data = useGapData();

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <IntervalMain {...data} />
      </div>
    </div>
  );
}
