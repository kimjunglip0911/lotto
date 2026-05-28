'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

// 사이드바: 현재 경로와 분석 메뉴 펼침 상태

export function useSidebarNav() {
  const pathname = usePathname();
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(
    pathname.startsWith('/analysis'),
  );

  const toggleAnalysisExpanded = () => setIsAnalysisExpanded((prev) => !prev);

  return { pathname, isAnalysisExpanded, toggleAnalysisExpanded };
}
