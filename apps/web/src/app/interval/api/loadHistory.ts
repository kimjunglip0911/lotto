/**
 * 번호별 간격 화면에 필요한 당첨 이력을 불러오는 파일입니다.
 *
 * 하는 일
 * - 저장된 회차 목록을 확인한 뒤, 가장 최신 회차까지의 당첨 이력을 가져옵니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 필요할 때 요청 취소 신호와 서버 주소
 * - 돌려줌: 당첨 이력 목록
 *
 * 실패·주의
 * - 서버가 데이터를 주지 못하면 호출한 훅에서 오류 안내를 표시합니다.
 */

import {
  fetchDrawNumbers,
  fetchWinningNumbersRange,
  type AccumulatedNumbersFetchContext,
} from '@/lib/accu-nums/api';
import type { WinningNumberRow } from '@/lib/accu-nums/types';

export type LoadGapHistoryCtx = Pick<AccumulatedNumbersFetchContext, 'baseUrl' | 'signal'>;

export const loadGapHistory = async (
  ctx?: LoadGapHistoryCtx,
): Promise<WinningNumberRow[]> => {
  const draws = await fetchDrawNumbers(ctx);
  if (draws.length === 0) return [];

  const maxDraw = Math.max(...draws);
  return fetchWinningNumbersRange(maxDraw + 1, ctx);
};
