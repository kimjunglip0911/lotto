import type { WinningNumberRow } from '@/app/analysis/final-pick/types/winRow';

/** 2단계 폴백용 예비 번호 풀(채택 풀 부족 시 단계적 확장) */

export type AdoptReservePools = {
  accumulatedExcluded: number[];
  chiExcludedByPct: number[];
};

/** 통합 채택 계산 결과 */

export type FinalPickAdoptedResult = {
  adopted: number[];
  reservePools: AdoptReservePools;
  previousDrawRows: WinningNumberRow[];
  error: string | null;
  infoMessage: string | null;
};
