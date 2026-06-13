import { isWinningNumberRow } from '@/app/analysis/accu-nums/logic/numCounts';
import type { WinningNumberRow } from '@/app/analysis/accu-nums/types';
import { accuNumsApiUrl } from '@/app/recommend/api/core/url';
import { fetchJson } from '@/app/recommend/api/core/fetchCore';

/**
 * 이 파일은 최신 회차를 기준으로 당첨 번호 범위를 요청하고, 화면이 바로 쓸 수 있는 행만 남긴다.
 * - 입력: 서버 주소와 최신 회차 번호를 받는다.
 * - 출력: 검증된 당첨 번호 행 배열을 돌려준다.
 * - 역할 분리: 회차 목록 조회는 다른 파일에서 담당하고, 이 파일은 범위 조회와 행 검증만 담당한다.
 * - 실패 영향: 서버 응답이 배열이 아니면 오류를 던져 상위 로직이 예외 처리 흐름으로 이동한다.
 */

const getRangeUpper = (latestDraw: number) => latestDraw + 1;

export const fetchWinningRangeRows = async (
  apiUrl: string,
  latestDraw: number,
): Promise<WinningNumberRow[]> => {
  const rangeUpper = getRangeUpper(latestDraw);
  const payload = await fetchJson<unknown>(
    accuNumsApiUrl(`winning-numbers-range?draw_no=${rangeUpper}`, apiUrl),
  );
  if (!Array.isArray(payload)) {
    throw new Error('Winning numbers range response is not an array');
  }
  return payload.filter(isWinningNumberRow);
};
