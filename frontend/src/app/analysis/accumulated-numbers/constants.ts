import type { WindowConfig } from './types';

export const NUMBER_RANGE_MAX = 45;

export const createEmptyCounts = () => Array.from({ length: NUMBER_RANGE_MAX }, () => 0);

export const WINDOW_CONFIGS: WindowConfig[] = [
  {
    key: 'period136',
    title: '평균근접 우선 기간 1 (이전 136회차)',
    windowSize: 136,
    noDataMessage: '선택 회차 기준 이전 136회차 데이터가 부족해 집계할 수 없습니다.',
  },
  {
    key: 'period192',
    title: '평균근접 우선 기간 2 (이전 192회차)',
    windowSize: 192,
    noDataMessage: '선택 회차 기준 이전 192회차 데이터가 부족해 집계할 수 없습니다.',
  },
  {
    key: 'period336',
    title: '상2+하2 우선 기간 1 (이전 336회차)',
    windowSize: 336,
    noDataMessage: '선택 회차 기준 이전 336회차 데이터가 부족해 집계할 수 없습니다.',
  },
  {
    key: 'period320',
    title: '상2+하2 우선 기간 2 (이전 320회차)',
    windowSize: 320,
    noDataMessage: '선택 회차 기준 이전 320회차 데이터가 부족해 집계할 수 없습니다.',
  },
];
