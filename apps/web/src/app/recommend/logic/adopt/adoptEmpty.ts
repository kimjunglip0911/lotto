import type { FinalPickAdoptedResult } from '@/app/recommend/logic/adopt/adoptTypes';

/** 채택 계산 실패 시 빈 결과를 만든다 */

export const emptyAdoptResult = (error: string): FinalPickAdoptedResult => ({
  adopted: [],
  previousDrawRows: [],
  error,
  infoMessage: null,
});
