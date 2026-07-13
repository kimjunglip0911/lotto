import 'server-only';
import { randomUUID } from 'crypto';
import type { GenerateSave } from '@/server/validate/recommend';
import { replaceExcludedInRows } from './recommend.helpers';
import * as repo from './repo';
import { METHOD_JL_SAVED } from './method';
import {
  analyzeDrawDuplicateSets,
  generateJlWheelSets,
} from './wheel.generator';

export async function generateAndSave(
  request: GenerateSave,
): Promise<Record<string, unknown>[]> {
  const drawNo = request.draw_no;
  const appliedRuleIds = request.applied_rule_ids ?? [];
  const excludedNumbers = [...new Set(request.excluded_numbers ?? [])].sort(
    (a, b) => a - b,
  );
  let rows: Record<string, unknown>[];
  if (request.sets?.length) {
    rows = request.sets.map((s) => ({
      num1: s.num1,
      num2: s.num2,
      num3: s.num3,
      num4: s.num4,
      num5: s.num5,
      num6: s.num6,
      strategy: s.strategy,
    }));
  } else {
    const excludedSet = new Set(excludedNumbers);
    rows = replaceExcludedInRows(
      generateJlWheelSets(drawNo, 20, 0),
      excludedSet,
    );
  }
  await repo.replaceDrawingsForMethod(
    drawNo,
    METHOD_JL_SAVED,
    rows,
    () => `jl_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
  );
  return rows.map((row) => ({
    num1: row.num1,
    num2: row.num2,
    num3: row.num3,
    num4: row.num4,
    num5: row.num5,
    num6: row.num6,
    method: METHOD_JL_SAVED,
    strategy: row.strategy,
    applied_rule_ids: appliedRuleIds,
    excluded_numbers: excludedNumbers,
  }));
}

export function getDrawings(
  drawNo: number,
): Promise<Record<string, unknown>[]> {
  return repo.getDrawingsByMethod(drawNo, METHOD_JL_SAVED);
}

export function getDrawDuplicateInsight(
  drawNo: number,
  count: number,
): Record<string, unknown> {
  return analyzeDrawDuplicateSets(drawNo, count);
}
