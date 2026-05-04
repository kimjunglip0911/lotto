import { useMemo } from 'react';
import {
  CHART_H,
  CHART_PADDING_BOTTOM,
  CHART_PADDING_TOP,
  CHART_W_PER_NUM,
  K_TREND,
  TOTAL_NUMBERS,
} from '../constants';
import { rateToY } from '../logic/trend';
import type { NumberTrendResult, WinningNumberRow } from '../types';

type Params = {
  trendResults: NumberTrendResult[];
  trendBaseline: number;
  selectedWinningNumber: WinningNumberRow | null;
  searchedDraw: string;
  isLoadingDraws: boolean;
  drawLoadError: string | null;
  availableDraws: number[];
  isSearching: boolean;
  selectedDraw: string;
  searchError: string | null;
};

export const useTrendDerived = ({
  trendResults,
  trendBaseline,
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
  const hasResults = trendResults.length > 0;

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

  const maxRate = useMemo(() => {
    const floor = 0.02;
    const emaVals = trendResults.map((r) => r.ema);
    if (emaVals.length === 0) {
      return Math.max(trendBaseline * 2, floor);
    }
    return Math.max(...emaVals, trendBaseline * 1.5, floor);
  }, [trendResults, trendBaseline]);

  const chartTotalW = TOTAL_NUMBERS * CHART_W_PER_NUM;
  const baselineY = rateToY(trendBaseline, maxRate);

  const statusMessage = isLoadingDraws
    ? '회차 정보를 불러오는 중입니다.'
    : drawLoadError
      ? `${drawLoadError} 잠시 후 다시 시도해 주세요.`
      : availableDraws.length === 0
        ? '조회 가능한 회차 정보가 없습니다.'
        : isSearching
          ? `${selectedDraw}회 기준 추세 분석을 계산하고 있습니다.`
          : searchError
            ? `${searchError} 잠시 후 다시 시도해 주세요.`
            : hasSearched
              ? null
              : '회차를 선택한 뒤 조회 버튼을 누르면 추세 분석 결과를 표시합니다.';

  return {
    hasSearched,
    noHistory,
    hasResults,
    selectedMainNumbers,
    selectedWinningNumberSet,
    maxRate,
    chartTotalW,
    baselineY,
    statusMessage,
    baseline: trendBaseline,
    kTrend: K_TREND,
    chartHeight: CHART_H,
    chartPaddingTop: CHART_PADDING_TOP,
    chartPaddingBottom: CHART_PADDING_BOTTOM,
    chartWidthPerNum: CHART_W_PER_NUM,
  };
};
