import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';
import { fillSlotRange } from '@/app/recommend/logic/combo/fillRange';
import { finishGen } from '@/app/recommend/logic/combo/genDone';
import { startGen } from '@/app/recommend/logic/combo/genStart';
import type {
  CombinationGenerationOptions,
  CombinationGenerationResult,
} from '@/app/recommend/logic/combo/genTypes';

export type { CombinationGenerationOptions, CombinationGenerationResult };

/** 1부터 45 전체 풀·최대 30세트 생성 */

export const generateCombinationBasedSets = async (
  bandWindowHistories: readonly (readonly WinningNumberRow[])[],
  numberPool: readonly number[],
  referenceDrawNo: number,
  options: CombinationGenerationOptions = {},
): Promise<CombinationGenerationResult> => {
  const started = startGen(bandWindowHistories, numberPool, referenceDrawNo, options);
  if ('result' in started) return started.result;
  await fillSlotRange(started.ctx, 0, TARGET_SET_COUNT);
  return finishGen(started.ctx, started.lines);
};
