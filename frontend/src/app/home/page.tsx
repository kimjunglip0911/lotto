'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { LotteryGrid } from '@/app/home/components/LotteryGrid';

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7362/ingest/abffb62d-8118-4522-ba11-17c2ce3f222c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '3e606a' },
      body: JSON.stringify({
        sessionId: '3e606a',
        runId: 'ts-diagnostic-investigation',
        hypothesisId: 'H1',
        location: 'src/app/home/page.tsx:11',
        message: 'Home page mounted from current app route tree',
        data: { route: '/', routeFile: 'src/app/home/page.tsx' },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, []);
  // #endregion

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto pb-8 px-4 pt-4 space-y-8">
          <LotteryGrid />
        </main>
      </div>
    </div>
  );
}

