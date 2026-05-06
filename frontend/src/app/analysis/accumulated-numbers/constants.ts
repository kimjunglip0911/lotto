import type { WindowConfig } from './types';

export const NUMBER_RANGE_MAX = 45;

export const createEmptyCounts = () => Array.from({ length: NUMBER_RANGE_MAX }, () => 0);

/** 누적 분석 고정 윈도: 2년(52회×2) */
export const ACCUMULATED_STRATEGY_WINDOW_DRAWS = 104;

export const WINDOW_CONFIGS: WindowConfig[] = [
  {
    key: 'period104',
    title: '이전 104회차 누적 (2년)',
    windowSize: ACCUMULATED_STRATEGY_WINDOW_DRAWS,
    noDataMessage: '선택 회차 기준 이전 104회차(2년) 데이터가 부족해 집계할 수 없습니다.',
  },
];
