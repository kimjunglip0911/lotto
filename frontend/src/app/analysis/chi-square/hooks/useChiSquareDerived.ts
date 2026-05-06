import { useMemo } from 'react';
import {
  ADOPTED_USAGE_NUMBER_COUNT,
  CHI_SQUARE_THRESHOLD,
  NUMBERS_PER_DRAW,
  TOTAL_NUMBERS,
} from '../constants';
import { getMaxAbsDeviation } from '../logic/chiSquare';
import {
  runChiSquareRelPctBinWalkForward,
  selectNumbersByRelPctBinMergedRanking,
  splitAndSortRelPctBins,
} from '../logic/walkForwardStats';
import type { ChiSquareResult, WinningNumberRow } from '../types';

type Params = {
  analyzedDrawCount: number;
  chiSquareResults: ChiSquareResult[];
  walkForwardRows: readonly WinningNumberRow[] | null;
  selectedWinningNumber: WinningNumberRow | null;
  searchedDraw: string;
  isLoadingDraws: boolean;
  drawLoadError: string | null;
  availableDraws: number[];
  isSearching: boolean;
  selectedDraw: string;
  searchError: string | null;
};

export const useChiSquareDerived = ({
  analyzedDrawCount,
  chiSquareResults,
  walkForwardRows,
  selectedWinningNumber,
  searchedDraw,
  isLoadingDraws,
  drawLoadError,
  availableDraws,
  isSearching,
  selectedDraw,
  searchError,
}: Params) => {
  const hasSearched = searchedDraw !== '';
  const searchedDrawNo = Number(searchedDraw);
  const noHistory = hasSearched && searchedDrawNo <= 1;

  const expected = analyzedDrawCount > 0 ? (analyzedDrawCount * NUMBERS_PER_DRAW) / TOTAL_NUMBERS : 0;
  const lowFreqNumbers = chiSquareResults.filter((r) => r.isLowFreq);
  const highFreqNumbers = chiSquareResults.filter((r) => r.isHighFreq);

  const selectedMainNumbers = selectedWinningNumber
    ? [
        selectedWinningNumber.num1,
        selectedWinningNumber.num2,
        selectedWinningNumber.num3,
        selectedWinningNumber.num4,
        selectedWinningNumber.num5,
        selectedWinningNumber.num6,
      ]
    : [];

  const selectedWinningNumberSet = selectedWinningNumber
    ? new Set([
        selectedWinningNumber.num1,
        selectedWinningNumber.num2,
        selectedWinningNumber.num3,
        selectedWinningNumber.num4,
        selectedWinningNumber.num5,
        selectedWinningNumber.num6,
        selectedWinningNumber.bonus_num,
      ])
    : null;

  const maxAbsDeviation = useMemo(() => getMaxAbsDeviation(chiSquareResults), [chiSquareResults]);

  /** 상대편차 1% 구간 워크포워드: 표용 분리 + 채택용 전체 구간. 2회차 이상일 때만. */
  const relPctBinWalkForwardBlock = useMemo(() => {
    if (walkForwardRows === null || walkForwardRows.length < 2) {
      return null;
    }
    const summary = runChiSquareRelPctBinWalkForward([...walkForwardRows], { minPastDraws: 1 });
    return {
      presentation: splitAndSortRelPctBins(summary),
      summary,
    };
  }, [walkForwardRows]);

  const relPctBinWalkForwardPresentation = relPctBinWalkForwardBlock?.presentation ?? null;

  const adoptedUsageNumbers = useMemo(() => {
    if (relPctBinWalkForwardBlock === null || chiSquareResults.length === 0) {
      return null;
    }
    return selectNumbersByRelPctBinMergedRanking(
      chiSquareResults,
      relPctBinWalkForwardBlock.summary.allBins,
      ADOPTED_USAGE_NUMBER_COUNT,
    );
  }, [relPctBinWalkForwardBlock, chiSquareResults]);

  const adoptedUsageNumberSet = useMemo(
    () => (adoptedUsageNumbers ? new Set<number>(adoptedUsageNumbers) : null),
    [adoptedUsageNumbers],
  );

  const statusMessage = isLoadingDraws
    ? '회차 정보를 불러오는 중입니다.'
    : drawLoadError
      ? `${drawLoadError} 잠시 후 다시 시도해 주세요.`
      : availableDraws.length === 0
        ? '조회 가능한 회차 정보가 없습니다.'
        : isSearching
          ? `${selectedDraw}회 기준 누적번호 분석과 카이제곱 검정을 계산하고 있습니다.`
          : searchError
            ? `${searchError} 잠시 후 다시 시도해 주세요.`
            : hasSearched
              ? null
              : '회차를 선택한 뒤 조회 버튼을 누르면 카이제곱 검정 결과를 표시합니다.';

  return {
    hasSearched,
    noHistory,
    expected,
    lowFreqNumbers,
    highFreqNumbers,
    selectedMainNumbers,
    selectedWinningNumberSet,
    maxAbsDeviation,
    adoptedUsageNumbers,
    adoptedUsageNumberSet,
    statusMessage,
    chiSquareThreshold: CHI_SQUARE_THRESHOLD,
    relPctBinWalkForwardPresentation,
  };
};
