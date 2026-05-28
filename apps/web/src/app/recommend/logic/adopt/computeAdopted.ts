import { fetchWinningOne, fetchWinningRange } from '@/app/recommend/api/adopt/fetchWinning';
import { emptyAdoptResult } from '@/app/recommend/logic/adopt/adoptEmpty';
import { buildAdoptedSlice } from '@/app/recommend/logic/adopt/buildSlice';
import { fetchAdoptedForDrawOne } from '@/app/recommend/logic/adopt/fetchDrawOne';
import { parseWinRange } from '@/app/recommend/logic/adopt/parseWinRows';
import { resolveMainNumbers } from '@/app/recommend/logic/adopt/resolveMain';
import type { FinalPickAdoptedResult } from '@/app/recommend/logic/adopt/adoptTypes';

/** 통합 분석과 동일 경로로 최종 채택 번호를 계산한다 */

export const fetchFinalPickAdopted = async (
  apiUrl: string,
  drawNo: number,
): Promise<FinalPickAdoptedResult> => {
  if (!Number.isInteger(drawNo) || drawNo < 1) {
    return emptyAdoptResult('유효한 회차가 아닙니다.');
  }

  try {
    if (drawNo === 1) return fetchAdoptedForDrawOne(apiUrl);

    const [winningRes, rangeRes] = await Promise.all([
      fetchWinningOne(apiUrl, drawNo),
      fetchWinningRange(apiUrl, drawNo),
    ]);

    if (!rangeRes.ok) {
      throw new Error(`winning-numbers-range: ${rangeRes.status}`);
    }

    const rangeParsed = parseWinRange(await rangeRes.json());
    if ('error' in rangeParsed) return emptyAdoptResult(rangeParsed.error);

    const mainResolved = await resolveMainNumbers(apiUrl, drawNo, winningRes);
    if ('error' in mainResolved) return emptyAdoptResult(mainResolved.error);

    return buildAdoptedSlice(
      rangeParsed.previousDrawRows,
      mainResolved.main,
      drawNo,
      mainResolved.infoMessage,
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return emptyAdoptResult(msg || '통합 채택 계산 중 오류가 발생했습니다.');
  }
};
