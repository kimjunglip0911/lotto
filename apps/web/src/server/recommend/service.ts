import 'server-only';
import { HttpError } from '@/server/http/error';
import {
  buildNumberCounts,
  pickLeastFrequentNumber,
  pickTopNumber,
} from './recommend.helpers';
import * as repo from './repo';
import { WINDOW_SIZES } from './window-sizes';
import { generateWheelSets } from './wheel.generator';

export async function getExclusionCandidates(
  drawNo?: number,
): Promise<Record<string, unknown>> {
  try {
    const targetDrawNo = await repo.resolveTargetDrawNo(drawNo);
    const rowsByWindow = await repo.fetchRowsByWindow(targetDrawNo);
    const overallCounts = buildNumberCounts(rowsByWindow.overall ?? []);
    const leastFrequentOverall = pickLeastFrequentNumber(overallCounts);
    const windowTopNumbers: Record<string, unknown> = {};
    for (const windowName of Object.keys(WINDOW_SIZES)) {
      const counts = buildNumberCounts(rowsByWindow[windowName] ?? []);
      windowTopNumbers[windowName] = pickTopNumber(counts);
    }
    const excludedNumbersUnion = [
      ...new Set(
        Object.values(windowTopNumbers).map(
          (info) => (info as { number: number }).number,
        ),
      ),
    ].sort((a, b) => a - b);
    const drawCounts: Record<string, number> = {};
    for (const [k, rows] of Object.entries(rowsByWindow)) {
      drawCounts[k] = rows.length;
    }
    return {
      drawNo: targetDrawNo,
      leastFrequentOverall,
      windowTopNumbers,
      excludedNumbersUnion,
      drawCounts,
      ruleMeta: {
        topTiePolicy: 'min-number-on-tie',
        leastTiePolicy: 'min-number-on-tie',
        countedFields: [
          'num1',
          'num2',
          'num3',
          'num4',
          'num5',
          'num6',
          'bonus_num',
        ],
      },
    };
  } catch (e) {
    if (e instanceof HttpError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('ValueError') || msg.includes('must')) {
      throw new HttpError(400, msg);
    }
    throw new HttpError(500, msg);
  }
}

export function generateWheel(
  count: number,
  drawNo?: number,
  _seed?: number,
): Record<string, unknown>[] {
  return generateWheelSets(count, 0, drawNo);
}
