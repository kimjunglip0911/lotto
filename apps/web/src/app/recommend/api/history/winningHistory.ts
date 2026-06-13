import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { fetchDraws } from '@/app/recommend/api/history/fetchDraws';
import { fetchWinningRangeRows } from '@/app/recommend/api/history/fetchRange';

/**
 * 이 파일은 추천 화면에서 쓰는 전체 당첨 번호 이력 조회 흐름을 한 번에 묶어 실행한다.
 * - 입력: 서버 주소를 받는다.
 * - 출력: 검증된 당첨 번호 이력 배열을 돌려준다.
 * - 역할 분리: 회차 목록 조회와 범위 조회/검증은 각 전용 파일로 분리되어 있고, 이 파일은 순서 제어만 담당한다.
 * - 실패 영향: 하위 조회에서 생긴 오류는 그대로 위로 전달되어, 화면 상위 로직이 예외 안내나 대체 흐름을 선택한다.
 */

export const fetchWinningFullHistory = async (apiUrl: string): Promise<WinningNumberRow[]> => {
  const draws = await fetchDraws(apiUrl);
  if (draws.length === 0) return [];

  const latestDraw = Math.max(...draws);
  return fetchWinningRangeRows(apiUrl, latestDraw);
};
