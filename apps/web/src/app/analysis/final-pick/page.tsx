'use client';

import { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { useFinalPickData } from './hooks/useFinalPickData';
import { FinalPickMain } from './ui/FinalPickMain';

/** 통합 분석 페이지 — 레이아웃·사이드바·데이터 훅 연결. */
export default function FinalPickPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const data = useFinalPickData();

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <FinalPickMain data={data} />
      </div>
    </div>
  );
}
