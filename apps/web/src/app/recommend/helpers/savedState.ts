import {
  savedErrorMessage,
  savedLoadingMessage,
} from '@/app/recommend/helpers/savedMessages';
import type { SavedDrawLoadResult } from '@/app/recommend/types/savedLoad';
import type { SavedHookOpts } from '@/app/recommend/types/savedHook';

/** 저장 세트 조회 전·후 UI 상태 갱신 */

export const resetSavedBeforeLoad = (opts: SavedHookOpts, drawNo: number): void => {
  opts.setGeneratedSets([]);
  opts.setWinningNumbers(null);
  opts.setCombinationSummaryLines([]);
  opts.setError(null);
  opts.setStatusMessage(savedLoadingMessage(drawNo));
};

export const applySavedLoadResult = (
  opts: SavedHookOpts,
  result: SavedDrawLoadResult,
): void => {
  opts.setWinningNumbers(result.winningNumbers);
  opts.setGeneratedSets(result.orderedSets);
  opts.setCombinationSummaryLines(result.summaryLines);
  opts.setStatusMessage(result.statusMessage);
};

export const applySavedLoadError = (
  opts: SavedHookOpts,
  drawNo: number,
  err: unknown,
): void => {
  opts.setGeneratedSets([]);
  opts.setCombinationSummaryLines([]);
  opts.setStatusMessage(savedErrorMessage(drawNo));
  console.error('Error fetching saved drawings:', err);
};
