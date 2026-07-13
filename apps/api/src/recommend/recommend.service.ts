import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { GenerateSaveDto } from '../domain/dto/recommend.dto';
import {
  buildNumberCounts,
  pickLeastFrequentNumber,
  pickTopNumber,
  replaceExcludedInRows,
} from './recommend.helpers';
import { RecommendRepository } from './recommend.repository';
import { WINDOW_SIZES } from './window-sizes';
import {
  analyzeDrawDuplicateSets,
  generateJlWheelSets,
  generateWheelSets,
} from './wheel.generator';

export const METHOD_JL_SAVED = 'JL Wheel Method';

@Injectable()
export class RecommendService {
  constructor(private readonly repo: RecommendRepository) {}

  async getExclusionCandidates(
    drawNo?: number,
  ): Promise<Record<string, unknown>> {
    try {
      const targetDrawNo = await this.repo.resolveTargetDrawNo(drawNo);
      const rowsByWindow = await this.repo.fetchRowsByWindow(targetDrawNo);
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
      if (e instanceof HttpException) {
        throw e;
      }
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('ValueError') || msg.includes('must')) {
        throw new HttpException(msg, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(msg, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  generateWheel(
    count: number,
    drawNo?: number,
    seed?: number,
  ): Record<string, unknown>[] {
    if (seed != null) {
      /* fallback generator does not fix seed; matches Python optional seed behavior when jl missing */
    }
    return generateWheelSets(count, 0, drawNo);
  }

  async generateAndSave(
    request: GenerateSaveDto,
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
    await this.repo.replaceDrawingsForMethod(
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

  getDrawings(drawNo: number): Promise<Record<string, unknown>[]> {
    return this.repo.getDrawingsByDrawNoAndMethod(drawNo, METHOD_JL_SAVED);
  }

  getDrawDuplicateInsight(
    drawNo: number,
    count: number,
  ): Record<string, unknown> {
    return analyzeDrawDuplicateSets(drawNo, count);
  }
}
