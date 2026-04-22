'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';

export default function AccumulatedNumbersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-6 space-y-6">
          <div className="flex flex-col gap-2 mb-4">
            <h2 className="text-3xl font-bold text-white tracking-tight">누적 번호 분석</h2>
            <p className="text-slate-400 text-sm">회차 누적 데이터를 기반으로 번호 패턴을 분석하는 화면입니다.</p>
          </div>

          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-6">
            <p className="text-slate-300 text-sm leading-relaxed">
              누적 번호 분석 콘텐츠는 다음 단계에서 연결됩니다. 현재는 분석 메뉴 구조와 페이지 진입 경로를 우선 제공합니다.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
