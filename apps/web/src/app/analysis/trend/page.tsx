'use client';

import { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useTrendData } from './hooks/useTrendData';
import { useTrendView } from './hooks/useTrendView';
import { TrendMain } from './ui/TrendMain';

export default function TrendPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const data = useTrendData();
  const view = useTrendView(data);

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <TrendMain data={data} view={view} />
      </div>
    </div>
  );
}
