import { getConsecutivelyAppearedMainNumbers } from '@/app/analysis/run-streak/logic/consec';
import { getAccumulatedExclusionNumbers } from '@/app/analysis/final-pick/logic/accuAdopt';
import { getChiSquareFinalPickSlice } from '@/app/analysis/final-pick/logic/chiWf';
import {
  extractMainNumbers,
  isWinningNumberRow,
  type WinningNumberRow,
} from '@/app/analysis/final-pick/types/winRow';
import { fetchWinningOne, fetchWinningRange } from '@/app/recommend/api/adopt/fetchWinning';
import type { FinalPickAdoptedResult } from '@/app/recommend/logic/adopt/adoptTypes';

/** 통합 분석과 동일 경로로 최종 채택 번호를 계산한다 */

const empty = (error: string): FinalPickAdoptedResult => ({
  adopted: [],
  previousDrawRows: [],
  error,
  infoMessage: null,
});

const sliceFrom = (
  previousDrawRows: WinningNumberRow[],
  main: number[],
  drawNo: number,
  infoMessage: string | null,
): FinalPickAdoptedResult => {
  const excludedByStreakNumbers = getConsecutivelyAppearedMainNumbers(previousDrawRows, drawNo);
  const accumulated = getAccumulatedExclusionNumbers({ previousDrawRows });
  const slice = getChiSquareFinalPickSlice({
    previousDrawRows,
    selectedMainNumbers: main,
    excludedByStreakNumbers,
    accumulatedExclusionNumbers: accumulated.excludedUnique,
  });
  return { adopted: slice.adopted, previousDrawRows, error: null, infoMessage };
};

export const fetchFinalPickAdopted = async (
  apiUrl: string,
  drawNo: number,
): Promise<FinalPickAdoptedResult> => {
  if (!Number.isInteger(drawNo) || drawNo < 1) {
    return empty('유효한 회차가 아닙니다.');
  }

  try {
    if (drawNo === 1) {
      const winningRes = await fetchWinningOne(apiUrl, 1);
      if (!winningRes.ok) {
        if (winningRes.status === 404) {
          return empty('선택한 회차의 당첨번호를 찾을 수 없습니다.');
        }
        throw new Error(`winning-number: ${winningRes.status}`);
      }
      const winningData: unknown = await winningRes.json();
      if (!isWinningNumberRow(winningData)) {
        return empty('당첨번호 응답 형식이 올바르지 않습니다.');
      }
      return sliceFrom([], extractMainNumbers(winningData), 1, null);
    }

    const [winningRes, rangeRes] = await Promise.all([
      fetchWinningOne(apiUrl, drawNo),
      fetchWinningRange(apiUrl, drawNo),
    ]);

    if (!rangeRes.ok) {
      throw new Error(`winning-numbers-range: ${rangeRes.status}`);
    }

    const rangeData: unknown = await rangeRes.json();
    if (!Array.isArray(rangeData)) {
      return empty('당첨 이력 응답 형식이 올바르지 않습니다.');
    }

    const previousDrawRows = rangeData.filter(isWinningNumberRow);
    let main: number[];
    let infoMessage: string | null = null;

    if (winningRes.ok) {
      const winningData: unknown = await winningRes.json();
      if (!isWinningNumberRow(winningData)) {
        return empty('당첨번호 응답 형식이 올바르지 않습니다.');
      }
      main = extractMainNumbers(winningData);
    } else if (winningRes.status === 404 && drawNo > 1) {
      const prevRes = await fetchWinningOne(apiUrl, drawNo - 1);
      if (!prevRes.ok) {
        return empty(
          prevRes.status === 404
            ? `${drawNo}회·${drawNo - 1}회 당첨번호를 모두 찾을 수 없습니다.`
            : `전회차 당첨 조회 실패: ${prevRes.status}`,
        );
      }
      const prevData: unknown = await prevRes.json();
      if (!isWinningNumberRow(prevData)) {
        return empty('전회차 당첨번호 응답 형식이 올바르지 않습니다.');
      }
      main = extractMainNumbers(prevData);
      infoMessage = `${drawNo}회는 아직 당첨번호가 없어, 카이제곱 워크포워드 기준 번호로 ${drawNo - 1}회 당첨 본번호 6개를 사용했습니다.`;
    } else {
      throw new Error(`winning-number: ${winningRes.status}`);
    }

    return sliceFrom(previousDrawRows, main, drawNo, infoMessage);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      adopted: [],
      previousDrawRows: [],
      error: msg || '통합 채택 계산 중 오류가 발생했습니다.',
      infoMessage: null,
    };
  }
};
