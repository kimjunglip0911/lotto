import type { WindowConfig } from './types';

export const NUMBER_RANGE_MAX = 45;

export const createEmptyCounts = () => Array.from({ length: NUMBER_RANGE_MAX }, () => 0);

export const WINDOW_CONFIGS: WindowConfig[] = [
  {
    key: 'thirtyDay',
    title: '30일 누적 출현 횟수 (이전 4회차)',
    windowSize: 4,
    noDataMessage: '선택 회차 기준 이전 4회차 데이터가 부족해 집계할 수 없습니다.',
  },
  {
    key: 'ninetyDay',
    title: '90일 누적 출현 횟수 (이전 12회차)',
    windowSize: 12,
    noDataMessage: '선택 회차 기준 이전 12회차 데이터가 부족해 집계할 수 없습니다.',
  },
  {
    key: 'sixMonth',
    title: '6개월 누적 출현 횟수 (이전 26회차)',
    windowSize: 26,
    noDataMessage: '선택 회차 기준 이전 26회차 데이터가 부족해 집계할 수 없습니다.',
  },
  {
    key: 'oneYear',
    title: '1년 누적 출현 횟수 (이전 52회차)',
    windowSize: 52,
    noDataMessage: '선택 회차 기준 이전 52회차 데이터가 부족해 집계할 수 없습니다.',
  },
  {
    key: 'threeYear',
    title: '3년 누적 출현 횟수 (이전 156회차)',
    windowSize: 156,
    noDataMessage: '선택 회차 기준 이전 156회차 데이터가 부족해 집계할 수 없습니다.',
  },
  {
    key: 'fiveYear',
    title: '5년 누적 출현 횟수 (이전 260회차)',
    windowSize: 260,
    noDataMessage: '선택 회차 기준 이전 260회차 데이터가 부족해 집계할 수 없습니다.',
  },
  {
    key: 'tenYear',
    title: '10년 누적 출현 횟수 (이전 520회차)',
    windowSize: 520,
    noDataMessage: '선택 회차 기준 이전 520회차 데이터가 부족해 집계할 수 없습니다.',
  },
];
