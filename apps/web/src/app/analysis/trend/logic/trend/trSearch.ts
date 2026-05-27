import { loadAllHistory, loadWinningByDraw } from '../../api';
import { aggregateDeviationBins } from '../bins';
import { buildTrendResults, computeEmpiricalAppearanceRate } from '../trend';
import type {
  DeviationBinsSummary,
  NumberTrendResult,
  WinningNumberRow,
} from '../../types';

export const parseTrendDrawNo = (selectedDraw: string): number | null => {
  if (!selectedDraw) return null;
  const drawNo = Number(selectedDraw);
  if (!Number.isInteger(drawNo) || drawNo < 1) return null;
  return drawNo;
};

export type TrSearchOk =
  | { kind: 'first'; winning: WinningNumberRow }
  | {
      kind: 'range';
      winning: WinningNumberRow;
      historyCount: number;
      trendBaseline: number;
      trendResults: NumberTrendResult[];
      deviationBinsSummary: DeviationBinsSummary;
    };

export const loadTrendSearch = async (drawNo: number): Promise<TrSearchOk> => {
  if (drawNo === 1) {
    const winning = await loadWinningByDraw(drawNo);
    return { kind: 'first', winning };
  }

  let winning: WinningNumberRow;
  try {
    winning = await loadWinningByDraw(drawNo);
  } catch (error) {
    if (error instanceof Error && error.message === 'Failed: 404') {
      throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
    }
    throw error;
  }

  const historyRows = await loadAllHistory(drawNo);
  const sortedRows = [...historyRows].sort((a, b) => a.draw_no - b.draw_no);
  const trendBaseline = computeEmpiricalAppearanceRate(sortedRows);

  return {
    kind: 'range',
    winning,
    historyCount: historyRows.length,
    trendBaseline,
    trendResults: buildTrendResults(sortedRows),
    deviationBinsSummary: aggregateDeviationBins(sortedRows),
  };
};
