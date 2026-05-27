import { useMemo } from 'react';
import { getChiSquareWalkForwardExcludedSplit } from '@/app/analysis/final-pick/logic/chiWf';
import { CHI_SQUARE_THRESHOLD, NUMBERS_PER_DRAW, TOTAL_NUMBERS } from '../constants';
import { getMaxAbsDeviation } from '../logic/chiSquare';
import { runChiSquareDeviationBinWalkForward, splitAndSortDeviationBins } from '../logic/walkForwardStats';
import type { ChiSquareData } from './useChiSquareData';

export const useChiSquareDerived = (data: ChiSquareData) => {
  const {
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
  } = data;

  const hasSearched = searchedDraw !== '';
  const searchedDrawNo = Number(searchedDraw);
  const noHistory = hasSearched && searchedDrawNo <= 1;
  const expected = analyzedDrawCount > 0 ? (analyzedDrawCount * NUMBERS_PER_DRAW) / TOTAL_NUMBERS : 0;

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

  const selectedWinningNumberSet = useMemo(
    () =>
      selectedWinningNumber
        ? new Set([
            selectedWinningNumber.num1,
            selectedWinningNumber.num2,
            selectedWinningNumber.num3,
            selectedWinningNumber.num4,
            selectedWinningNumber.num5,
            selectedWinningNumber.num6,
          ])
        : null,
    [selectedWinningNumber],
  );

  const maxAbsDeviation = useMemo(() => getMaxAbsDeviation(chiSquareResults), [chiSquareResults]);

  const deviationBinWalkForwardBlock = useMemo(() => {
    if (walkForwardRows === null || walkForwardRows.length < 2) return null;
    const summary = runChiSquareDeviationBinWalkForward([...walkForwardRows], {
      minPastDraws: 1,
      referenceMainNumbers: selectedWinningNumberSet ?? undefined,
    });
    return { presentation: splitAndSortDeviationBins(summary), summary };
  }, [walkForwardRows, selectedWinningNumberSet]);

  const relPctBinWalkForwardPresentation = deviationBinWalkForwardBlock?.presentation ?? null;

  const walkForwardExcludedSplit = useMemo(() => {
    if (deviationBinWalkForwardBlock === null || chiSquareResults.length === 0) return null;
    return getChiSquareWalkForwardExcludedSplit(
      chiSquareResults,
      deviationBinWalkForwardBlock.summary.allBins,
    );
  }, [deviationBinWalkForwardBlock, chiSquareResults]);

  const walkForwardExcludedNumberSet = useMemo(() => {
    if (!walkForwardExcludedSplit) return null;
    return new Set<number>([
      ...walkForwardExcludedSplit.byConditionalPct,
      ...walkForwardExcludedSplit.byOverlapRounds,
    ]);
  }, [walkForwardExcludedSplit]);

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
    selectedMainNumbers,
    selectedWinningNumberSet,
    maxAbsDeviation,
    walkForwardExcludedSplit,
    walkForwardExcludedNumberSet,
    statusMessage,
    chiSquareThreshold: CHI_SQUARE_THRESHOLD,
    relPctBinWalkForwardPresentation,
  };
};

export type ChiSquareView = ReturnType<typeof useChiSquareDerived>;
