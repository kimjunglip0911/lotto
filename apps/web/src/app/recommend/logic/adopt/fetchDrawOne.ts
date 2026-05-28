import { fetchWinningOne } from '@/app/recommend/api/adopt/fetchWinning';
import { emptyAdoptResult } from '@/app/recommend/logic/adopt/adoptEmpty';
import { buildAdoptedSlice } from '@/app/recommend/logic/adopt/buildSlice';
import { parseWinRow } from '@/app/recommend/logic/adopt/parseWinRows';
import type { FinalPickAdoptedResult } from '@/app/recommend/logic/adopt/adoptTypes';

/** 1회차 당첨 조회 후 채택 슬라이스를 계산한다 */

export const fetchAdoptedForDrawOne = async (
  apiUrl: string,
): Promise<FinalPickAdoptedResult> => {
  const winningRes = await fetchWinningOne(apiUrl, 1);
  if (!winningRes.ok) {
    if (winningRes.status === 404) {
      return emptyAdoptResult('선택한 회차의 당첨번호를 찾을 수 없습니다.');
    }
    throw new Error(`winning-number: ${winningRes.status}`);
  }
  const parsed = parseWinRow(await winningRes.json());
  if ('error' in parsed) return emptyAdoptResult(parsed.error);
  return buildAdoptedSlice([], parsed.main, 1, null);
};
