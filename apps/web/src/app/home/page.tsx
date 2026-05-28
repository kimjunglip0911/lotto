'use client';

import { useState } from 'react';

import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/sidebar/Sidebar';

import { useHomeView } from './hooks/useHomeView';
import { HomeMain } from './ui/HomeMain';

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const view = useHomeView();

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <HomeMain view={view} />
      </div>
    </div>
  );
}
