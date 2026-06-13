'use client';

import { usePathname } from 'next/navigation';

// 사이드바: 현재 경로

export function useSidebarNav() {
  const pathname = usePathname();

  return { pathname };
}
