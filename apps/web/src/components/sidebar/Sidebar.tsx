'use client';

// 좌측 내비게이션 사이드바(열림·닫힘, 메뉴·활성 경로)

import type { SidebarProps } from './types/sidebarTypes';
import { useSidebarNav } from './hooks/useSidebarNav';
import { SidebarBackdrop } from './ui/SidebarBackdrop';
import { SidebarFooter } from './ui/SidebarFooter';
import { SidebarHeader } from './ui/SidebarHeader';
import { SidebarNav } from './ui/SidebarNav';

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { pathname } = useSidebarNav();

  const panelClass = `fixed top-0 left-0 h-full w-72 bg-card-bg border-r border-card-border/30 z-[70] transform transition-transform duration-300 ease-in-out ${
    isOpen ? 'translate-x-0' : '-translate-x-full'
  }`;

  return (
    <>
      <SidebarBackdrop isOpen={isOpen} onClose={onClose} />
      <aside className={panelClass}>
        <div className="flex flex-col h-full">
          <SidebarHeader onClose={onClose} />
          <SidebarNav pathname={pathname} onClose={onClose} />
          <SidebarFooter />
        </div>
      </aside>
    </>
  );
}
