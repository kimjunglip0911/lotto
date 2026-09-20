import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { freqGeTwo } from './freqGeTwo';

/** 최근 창에서 2회 이상 출현한 번호(오름차순). */
export const buildEqualExclude = (
  windowRows: readonly WinningNumberRow[],
): number[] => freqGeTwo(windowRows).filter((n) => n >= 1 && n <= 45);
