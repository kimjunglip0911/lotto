import type { WinningNumberRow } from '@/app/analysis/final-pick/types/winRow';

/** 통합 채택 계산 결과 */

export type FinalPickAdoptedResult = {
  adopted: number[];
  previousDrawRows: WinningNumberRow[];
  error: string | null;
  infoMessage: string | null;
};
