'use client';

import { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { useChiSquareData } from './hooks/useChiSquareData';
import { useChiSquareDerived } from './hooks/useChiSquareDerived';
import { ChiMain } from './ui/ChiMain';

export default function ChiSquarePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const data = useChiSquareData();
  const view = useChiSquareDerived(data);

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <ChiMain data={data} view={view} />
      </div>
    </div>
  );
}
