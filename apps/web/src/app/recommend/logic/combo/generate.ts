import type { PositionBandDistributionRow } from '@/app/combination/types';
import { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';
import { fillSlotRange } from '@/app/recommend/logic/combo/fillRange';
import { finishGen } from '@/app/recommend/logic/combo/genDone';
import { startGen } from '@/app/recommend/logic/combo/genStart';
import type {
  CombinationGenerationOptions,
  CombinationGenerationResult,
} from '@/app/recommend/logic/combo/genTypes';

export type { CombinationGenerationOptions, CombinationGenerationResult };

/** 저장본 자리대·최대 30세트 생성 */

export const generateCombinationBasedSets = async (
  storedRows: readonly PositionBandDistributionRow[],
  numberPool: readonly number[],
  referenceDrawNo: number,
  options: CombinationGenerationOptions = {},
): Promise<CombinationGenerationResult> => {
  const started = startGen(storedRows, numberPool, referenceDrawNo, options);
  if ('result' in started) return started.result;
  await fillSlotRange(started.ctx, 0, TARGET_SET_COUNT);
  return finishGen(started.ctx, started.lines);
};
