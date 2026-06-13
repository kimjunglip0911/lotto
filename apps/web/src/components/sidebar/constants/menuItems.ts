import type { SidebarMenuItem } from '../types/sidebarTypes';

// 좌측 사이드바에 표시할 메뉴 목록

export const MENU_ITEMS: SidebarMenuItem[] = [
  { title: '로또 번호 생성기', icon: 'casino', href: '/' },
  { title: '번호 추천', icon: 'analytics', href: '/recommend' },
  {
    title: '분석',
    icon: 'query_stats',
    children: [
      { title: '통합 분석', href: '/analysis/final-pick' },
      { title: '조합 분석', href: '/analysis/combination' },
      { title: '누적 번호 분석', href: '/analysis/accu-nums' },
    ],
  },
];
