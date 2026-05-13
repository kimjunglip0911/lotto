/** 조회 한 번에 쓰는 화면 상태 객체의 모양과 처음 값만 정의한다. */

import type { AccSearchOut } from './runAccSearch';
import type { AccumulatedCountExclusionResult } from './accuCntExt';
import { createEmptyCountResult } from './numCounts';
import type { CountResult, WinningNumberRow } from '../types';

export type AccSrchSt = {
  searchedDraw: string;
  isSearching: boolean;
  searchError: string | null;
  selectedWinningNumber: WinningNumberRow | null;
  isLoadingSelectedWinningNumber: boolean;
  selectedWinningNumberError: string | null;
  allTimeCountResult: CountResult;
  accumulatedCountExclusion: AccumulatedCountExclusionResult | null;
};

export const mkAccSrchInit = (): AccSrchSt => ({
  searchedDraw: '',
  isSearching: false,
  searchError: null,
  selectedWinningNumber: null,
  isLoadingSelectedWinningNumber: false,
  selectedWinningNumberError: null,
  allTimeCountResult: createEmptyCountResult(),
  accumulatedCountExclusion: null,
});

export type AccSrchAct =
  | { type: 'start'; draw: string }
  | { type: 'end' }
  | { type: 'fail' }
  | { type: 'invalidSel' }
  | { type: 'resetDerived'; clearWin?: boolean }
  | { type: 'apply'; out: AccSearchOut };
