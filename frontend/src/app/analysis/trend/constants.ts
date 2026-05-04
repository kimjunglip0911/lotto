import type { TrendPhase } from './types';

/** 단일 트렌드 EMA 평활 계수(기존 Slow k) */
export const K_TREND = 0.02;
/** 회차당 트렌드 출현 집계에 쓰는 주번호 개수(보너스 제외) */
export const MAIN_NUMBERS_PER_DRAW = 6;
/** 기댓값 대비 차이로 4국면을 나눌 때 사용하는 밴드 폭(비율 단위, 약 0.5%p) */
export const BASELINE_PHASE_BAND = 0.005;
export const TOTAL_NUMBERS = 45;

export const CHART_W_PER_NUM = 36;
export const CHART_H = 200;
export const CHART_PADDING_TOP = 16;
export const CHART_PADDING_BOTTOM = 24;
export const CHART_INNER_H = CHART_H - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

export const PHASE_META: Record<
  TrendPhase,
  { label: string; color: string; bgClass: string; borderClass: string; textClass: string; badgeClass: string }
> = {
  up_cont: {
    label: '상승지속',
    color: '#4ade80',
    bgClass: 'bg-emerald-500/8',
    borderClass: 'border-emerald-500/30',
    textClass: 'text-emerald-300',
    badgeClass: 'bg-emerald-500/25 text-emerald-200',
  },
  topping: {
    label: '하락전환',
    color: '#c084fc',
    bgClass: 'bg-violet-500/8',
    borderClass: 'border-violet-500/30',
    textClass: 'text-violet-300',
    badgeClass: 'bg-violet-500/25 text-violet-200',
  },
  recovering: {
    label: '회복중',
    color: '#38bdf8',
    bgClass: 'bg-sky-500/8',
    borderClass: 'border-sky-500/30',
    textClass: 'text-sky-300',
    badgeClass: 'bg-sky-500/25 text-sky-200',
  },
  down_cont: {
    label: '하락지속',
    color: '#f87171',
    bgClass: 'bg-rose-500/8',
    borderClass: 'border-rose-500/30',
    textClass: 'text-rose-300',
    badgeClass: 'bg-rose-500/25 text-rose-200',
  },
};
