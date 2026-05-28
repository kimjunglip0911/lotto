'use client';

import { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { CombinationMain } from './ui/CombinationMain';
import { useCombinationAnalysisData } from './hooks/useCombinationAnalysisData';

// "조합 분석" 화면: 레이아웃·사이드바와 데이터 훅을 조립해 CombinationMain에 넘깁니다.

export default function CombinationAnalysisPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const data = useCombinationAnalysisData();

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <CombinationMain {...data} />
      </div>
    </div>
  );
}
