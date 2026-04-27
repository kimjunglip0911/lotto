import type { TrendPhase } from './types';

export const K_CONFIG = { fast: 0.05, slow: 0.02 } as const;
export const BASELINE = 6 / 45;
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
