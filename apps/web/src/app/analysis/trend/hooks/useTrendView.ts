import { useMemo } from 'react';
import {
  CHART_H,
  CHART_PADDING_BOTTOM,
  CHART_PADDING_TOP,
  CHART_W_PER_NUM,
  K_TREND,
  TOTAL_NUMBERS,
} from '../constants/trendChart';
import { calcMaxRate } from '../helpers/chartMetrics';
import { buildTrendStatusMessage } from '../helpers/trendStatus';
import { mainNumsOf, winNumSet } from '../helpers/winNums';
import { rateToY } from '../logic/trend';
import type { TrendData } from './useTrendData';

export const useTrendView = (data: TrendData) => {
  const hasSearched = data.searchedDraw !== '';
  const searchedDrawNo = Number(data.searchedDraw);
  const noHistory = hasSearched && searchedDrawNo <= 1;
  const hasResults = data.trendResults.length > 0;

  const selectedMainNumbers = data.selectedWinningNumber
    ? mainNumsOf(data.selectedWinningNumber)
    : [];

  const selectedWinningNumberSet = winNumSet(data.selectedWinningNumber);

  const maxRate = useMemo(
    () => calcMaxRate(data.trendResults, data.trendBaseline),
    [data.trendResults, data.trendBaseline],
  );

  const chartTotalW = TOTAL_NUMBERS * CHART_W_PER_NUM;
  const baselineY = rateToY(data.trendBaseline, maxRate);

  const canShowPanels =
    hasSearched && !noHistory && !data.isSearching && !data.searchError && hasResults;

  const statusMessage = buildTrendStatusMessage({
    isLoadingDraws: data.isLoadingDraws,
    drawLoadError: data.drawLoadError,
    availableDrawsLength: data.availableDraws.length,
    isSearching: data.isSearching,
    selectedDraw: data.selectedDraw,
    searchError: data.searchError,
    hasSearched,
  });

  return {
    hasSearched,
    noHistory,
    hasResults,
    canShowPanels,
    selectedMainNumbers,
    selectedWinningNumberSet,
    maxRate,
    chartTotalW,
    baselineY,
    statusMessage,
    baseline: data.trendBaseline,
    kTrend: K_TREND,
    chartHeight: CHART_H,
    chartPaddingTop: CHART_PADDING_TOP,
    chartPaddingBottom: CHART_PADDING_BOTTOM,
    chartWidthPerNum: CHART_W_PER_NUM,
  };
};

export type TrendView = ReturnType<typeof useTrendView>;
