import { WINDOW_CONFIGS } from '../../constants';
import type { WinningNumberRow } from '../../types';
import type { EvaluationWindowSweepOptions } from './types';

/**
 * UI에 정의된 윈도우 + 다구간 스윕 후보를 생성한다.
 * - 단기(4~120): 4간격으로 촘촘히
 * - 중기(128~600): 8간격
 * - 장기(616~max): 16간격
 */
export function getDefaultEvaluationWindowSizes(options?: EvaluationWindowSweepOptions): number[] {
  const minWindow = Math.max(1, options?.minWindowSize ?? 4);
  const maxWindow = Math.max(minWindow, options?.maxWindowSize ?? 520);
  const fromUi = WINDOW_CONFIGS.map((c) => c.windowSize);
  const sweep: number[] = [];

  for (let w = minWindow; w <= Math.min(maxWindow, 120); w += 4) {
    sweep.push(w);
  }
  for (let w = Math.max(minWindow, 128); w <= Math.min(maxWindow, 600); w += 8) {
    sweep.push(w);
  }
  for (let w = Math.max(minWindow, 616); w <= maxWindow; w += 16) {
    sweep.push(w);
  }
  return [...new Set([...fromUi, ...sweep])].sort((a, b) => a - b);
}

/** draw_no 오름차순 정렬 전제 — drawNo 미만 회차만 담은 슬라이스 상한 인덱스 */
export function upperBoundDrawNo(sortedAsc: WinningNumberRow[], drawNo: number): number {
  let lo = 0;
  let hi = sortedAsc.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedAsc[mid].draw_no < drawNo) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

/** 직전 회차들 중 마지막 windowSize개(부족하면 있는 만큼) */
export function sliceWindowTail(priorSortedAsc: WinningNumberRow[], windowSize: number): WinningNumberRow[] {
  if (priorSortedAsc.length === 0 || windowSize < 1) {
    return [];
  }
  const n = Math.min(windowSize, priorSortedAsc.length);
  return priorSortedAsc.slice(priorSortedAsc.length - n);
}
