/**
 * 누적 번호 4개 선택 규칙 백테스트(당첨회차 D는 항상 draw_no < D 데이터만 사용).
 *
 * 실행(백엔드 8010 가동 후):
 *   cd frontend && npm run backtest:accumulated-numbers
 *
 * 환경 변수:
 *   ACCUMULATED_BACKTEST_API_URL — API 베이스(기본 http://127.0.0.1:8010)
 *   ACCUMULATED_BACKTEST_MIN_DRAW — 평가 시작 회차 하한(기본 100, 이보다 작은 회차는 지표 왜곡 방지를 위해 제외)
 *   ACCUMULATED_BACKTEST_MAX_DRAWS — 최근 N회차만 평가(기본 전체, 2 미만이면 전체)
 *   ACCUMULATED_BACKTEST_STRATEGIES — 평가할 전략(기본 focus)
 *     - 미지정 또는 `focus`: 평균근접(nearestMean4) + 상위2+하위2(twoHotTwoCold) 만
 *     - `all`: 네 전략 모두
 *     - 예: `nearestMean4,twoHotTwoCold` (쉼표 구분, 키 이름은 엔진과 동일)
 *
 * 참고: import 경로는 확장자 없이 두어 `tsc`와 호환된다.
 */

import { fetchDrawNumbers, fetchWinningNumbersRange } from '../api';
import { WINDOW_CONFIGS } from '../constants';
import {
  BACKTEST_FOCUS_STRATEGY_KEYS,
  BACKTEST_STRATEGY_KEYS,
  type BacktestAggregate,
  type BacktestStrategyKey,
  buildFinalNumberSelection,
  buildStrategyRecommendation,
  combineStrategyRecommendations,
  countMainHits,
  getDefaultBacktestWindowSizes,
  pickAdaptiveWindowsByStrategy,
  pickTopWindowsByStrategy,
  runAccumulatedNumbersBacktest,
} from '../logic/backtestEngine';
import { toMainNumbersOnly } from '../logic/numberCounts';
import type { WinningNumberRow } from '../types';

const DEFAULT_API = 'http://127.0.0.1:8010';
/** 이보다 작은 회차는 직전 누적이 너무 짧아 백테스트 지표 의미가 약하므로 평가에서 제외 */
const DEFAULT_MIN_EVAL_DRAW = 100;
const EXTENDED_WINDOW_MAX = 1208;

function strategyLabel(key: BacktestAggregate['strategy']): string {
  switch (key) {
    case 'top4Frequency':
      return '출현 많은 상위 4';
    case 'bottom4Frequency':
      return '출현 적은 하위 4';
    case 'nearestMean4':
      return '평균 출현에 가장 가까운 4';
    case 'twoHotTwoCold':
      return '상위 2 + 하위 2';
    default:
      return key;
  }
}

function sortRowsAsc(rows: WinningNumberRow[]): WinningNumberRow[] {
  return [...rows].sort((a, b) => a.draw_no - b.draw_no);
}

function formatPct(n: number, d: number): string {
  if (d <= 0) {
    return '—';
  }
  return `${((100 * n) / d).toFixed(2)}%`;
}

function rateAtLeastOne(a: BacktestAggregate): number {
  return a.evaluatedRounds > 0 ? a.roundsWithAtLeastOne / a.evaluatedRounds : 0;
}

function avgHits(a: BacktestAggregate): number {
  return a.evaluatedRounds > 0 ? a.sumHits / a.evaluatedRounds : 0;
}

/** 기본은 평균근접+상2하2, `all`이면 네 전략, 그 외는 쉼표 분리 키 */
function resolveStrategyKeys(): readonly BacktestStrategyKey[] {
  const raw = (process.env.ACCUMULATED_BACKTEST_STRATEGIES ?? '').trim().toLowerCase();
  if (raw === '' || raw === 'focus') {
    return BACKTEST_FOCUS_STRATEGY_KEYS;
  }
  if (raw === 'all') {
    return BACKTEST_STRATEGY_KEYS;
  }
  const allowed = new Set<string>(BACKTEST_STRATEGY_KEYS);
  const picked: BacktestStrategyKey[] = [];
  for (const part of raw.split(',')) {
    const key = part.trim() as BacktestStrategyKey;
    if (allowed.has(key)) {
      picked.push(key);
    }
  }
  return picked.length > 0 ? picked : BACKTEST_FOCUS_STRATEGY_KEYS;
}

/** 전략별 ≥1% 상위 윈도우 */
function printTopWindowsByStrategy(
  aggregates: BacktestAggregate[],
  strategy: BacktestStrategyKey,
  topN: number,
  label: string
): void {
  const rows = aggregates
    .filter((a) => a.strategy === strategy && a.evaluatedRounds > 0)
    .sort((a, b) => {
      const rb = rateAtLeastOne(b) - rateAtLeastOne(a);
      if (rb !== 0) return rb;
      return avgHits(b) - avgHits(a);
    })
    .slice(0, topN);

  console.log(`\n--- ${label}: "≥1 적중" 비율 상위 ${topN}개 기간(윈도우 N) ---\n`);
  console.log('N'.padStart(5) + '≥1%'.padStart(10) + 'avgHit'.padStart(10) + 'min'.padStart(6) + '  worstDr');
  console.log('-'.repeat(42));
  for (const a of rows) {
    console.log(
      String(a.windowSize).padStart(5) +
        formatPct(a.roundsWithAtLeastOne, a.evaluatedRounds).padStart(10) +
        avgHits(a).toFixed(3).padStart(10) +
        String(a.minHits).padStart(6) +
        `  ${a.worstDrawNo ?? '—'}`
    );
  }
}

/** 차트 UI와 동일한 이전 N회 구간에서 두 전략만 나란히 */
function printUiWindowPairComparison(aggregates: BacktestAggregate[]): void {
  const by = new Map<string, BacktestAggregate>();
  for (const a of aggregates) {
    by.set(`${a.strategy}|${a.windowSize}`, a);
  }

  console.log('\n=== UI 고정 기간(차트와 동일한 N) — 평균근접 vs 상위2+하위2 ===\n');
  const h1 = 'UI 구간'.padEnd(28) + 'N'.padStart(5);
  const h2 = '평균근접 ≥1%'.padStart(12) + 'avg'.padStart(8) + '  ' + '상2하2 ≥1%'.padStart(12) + 'avg'.padStart(8);
  console.log(h1 + h2);
  console.log('-'.repeat(75));

  for (const cfg of WINDOW_CONFIGS) {
    const m = by.get(`nearestMean4|${cfg.windowSize}`);
    const t = by.get(`twoHotTwoCold|${cfg.windowSize}`);
    const label = cfg.title.slice(0, 26);
    let line = label.padEnd(28) + String(cfg.windowSize).padStart(5);
    if (m && t) {
      line +=
        formatPct(m.roundsWithAtLeastOne, m.evaluatedRounds).padStart(12) +
        avgHits(m).toFixed(3).padStart(8) +
        '  ' +
        formatPct(t.roundsWithAtLeastOne, t.evaluatedRounds).padStart(12) +
        avgHits(t).toFixed(3).padStart(8);
    } else {
      line += ' (데이터 없음)';
    }
    console.log(line);
  }
}

function printTable(aggregates: BacktestAggregate[]): void {
  const header =
    'strategy'.padEnd(22) +
    'win'.padStart(5) +
    'n'.padStart(6) +
    'avgHit'.padStart(8) +
    '≥1%'.padStart(8) +
    'min'.padStart(5) +
    ' worstDr';
  console.log(header);
  console.log('-'.repeat(header.length));

  for (const a of aggregates) {
    const avg = a.evaluatedRounds > 0 ? a.sumHits / a.evaluatedRounds : 0;
    const line =
      strategyLabel(a.strategy).padEnd(22) +
      String(a.windowSize).padStart(5) +
      String(a.evaluatedRounds).padStart(6) +
      avg.toFixed(3).padStart(8) +
      formatPct(a.roundsWithAtLeastOne, a.evaluatedRounds).padStart(8) +
      String(a.minHits).padStart(5) +
      ` ${a.worstDrawNo ?? '—'}`;
    console.log(line);
  }
}

function runMergedFinalNumbersBacktest(params: {
  allRowsSortedAsc: WinningNumberRow[];
  drawNumbersToEvaluate: number[];
  aggregates: BacktestAggregate[];
}): {
  finalNumbersExample: number[];
  shortWindows: number[];
  longWindows: number[];
  evaluatedRounds: number;
  atLeastOneRate: number;
  avgHits: number;
  maxMissStreak: number;
} {
  const { allRowsSortedAsc, drawNumbersToEvaluate, aggregates } = params;

  const shortTop = pickAdaptiveWindowsByStrategy(aggregates, 'nearestMean4', {
    poolSize: 8,
    pickCount: 2,
    minWindowGap: 24,
  });
  const longTop = pickAdaptiveWindowsByStrategy(aggregates, 'twoHotTwoCold', {
    poolSize: 8,
    pickCount: 2,
    minWindowGap: 24,
    minWindowSize: 240,
  });

  const shortTopSafe = shortTop.length >= 2 ? shortTop : pickTopWindowsByStrategy(aggregates, 'nearestMean4', 2);
  const longTopSafe =
    longTop.length >= 2 ? longTop : pickTopWindowsByStrategy(aggregates, 'twoHotTwoCold', 2, { minWindowSize: 240 });

  const aggMap = new Map<string, BacktestAggregate>();
  for (const a of aggregates) {
    aggMap.set(`${a.strategy}|${a.windowSize}`, a);
  }

  const drawMap = new Map<number, WinningNumberRow>();
  for (const row of allRowsSortedAsc) {
    drawMap.set(row.draw_no, row);
  }

  let evaluatedRounds = 0;
  let roundsWithAtLeastOne = 0;
  let sumHits = 0;
  let currentMissStreak = 0;
  let maxMissStreak = 0;
  let finalNumbersExample: number[] = [];

  for (const drawNo of drawNumbersToEvaluate) {
    const actual = drawMap.get(drawNo);
    if (!actual) continue;
    const priorRows = allRowsSortedAsc.filter((r) => r.draw_no < drawNo);
    if (priorRows.length === 0) continue;

    const shortRecs = shortTopSafe
      .map((w) => {
        const agg = aggMap.get(`nearestMean4|${w.windowSize}`);
        if (!agg) return null;
        return buildStrategyRecommendation({
          strategy: 'nearestMean4',
          windowSize: w.windowSize,
          allRowsBeforeSelectedDraw: priorRows,
          aggregate: agg,
        });
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    const longRecs = longTopSafe
      .map((w) => {
        const agg = aggMap.get(`twoHotTwoCold|${w.windowSize}`);
        if (!agg) return null;
        return buildStrategyRecommendation({
          strategy: 'twoHotTwoCold',
          windowSize: w.windowSize,
          allRowsBeforeSelectedDraw: priorRows,
          aggregate: agg,
        });
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    const shortMerged = combineStrategyRecommendations(shortRecs);
    const longMerged = combineStrategyRecommendations(longRecs);
    if (!shortMerged || !longMerged) continue;

    const finalSelection = buildFinalNumberSelection(shortMerged, longMerged);
    const hits = countMainHits(finalSelection.finalNumbers, toMainNumbersOnly(actual));
    finalNumbersExample = finalSelection.finalNumbers;

    evaluatedRounds += 1;
    sumHits += hits;
    if (hits >= 1) {
      roundsWithAtLeastOne += 1;
      currentMissStreak = 0;
    } else {
      currentMissStreak += 1;
      if (currentMissStreak > maxMissStreak) maxMissStreak = currentMissStreak;
    }
  }

  return {
    finalNumbersExample,
    shortWindows: shortTopSafe.map((w) => w.windowSize),
    longWindows: longTopSafe.map((w) => w.windowSize),
    evaluatedRounds,
    atLeastOneRate: evaluatedRounds > 0 ? roundsWithAtLeastOne / evaluatedRounds : 0,
    avgHits: evaluatedRounds > 0 ? sumHits / evaluatedRounds : 0,
    maxMissStreak,
  };
}

/** 리포트에 붙여넣기 좋은 요약(동일 실행에서 stdout으로 복사 가능) */
function printMarkdownSnippet(
  aggregates: BacktestAggregate[],
  meta: {
    apiUrl: string;
    minDraw: number;
    maxDraw: number;
    evaluatedDrawCount: number;
    windowCount: number;
    strategyKeys: readonly BacktestStrategyKey[];
  }
): void {
  const bestByStrategy = new Map<string, BacktestAggregate>();
  for (const a of aggregates) {
    if (a.evaluatedRounds === 0) continue;
    const rate = rateAtLeastOne(a);
    const prev = bestByStrategy.get(a.strategy);
    if (!prev || rateAtLeastOne(prev) < rate) {
      bestByStrategy.set(a.strategy, a);
    }
  }

  console.log('\n--- 리포트용 요약 (복사) ---\n');
  console.log('```');
  console.log(`- API: ${meta.apiUrl}`);
  console.log(`- 평가 회차 범위: ${meta.minDraw} ~ ${meta.maxDraw} (총 ${meta.evaluatedDrawCount}회, 당첨 데이터 존재)`);
  console.log(`- 윈도우 후보 수: ${meta.windowCount} (UI 고정값 + 단/중/장기 다구간 스윕)`);
  console.log(`- 전략: ${meta.strategyKeys.join(', ')}`);
  console.log(`- 집계: 본번호+보너스 출현 합 / 적중: 본번호 6개만 교집합`);
  console.log('');
  for (const s of meta.strategyKeys) {
    const b = bestByStrategy.get(s);
    if (!b) {
      console.log(`- ${strategyLabel(s)}: 데이터 없음`);
      continue;
    }
    const rate = rateAtLeastOne(b);
    console.log(
      `- ${strategyLabel(s)} — 최고 "≥1적중" 비율 윈도우: ${b.windowSize}회차 창, ≥1 비율 ${(100 * rate).toFixed(2)}%, 평균 적중 ${avgHits(b).toFixed(3)}, 최소 적중 ${b.minHits} (회차 ${b.worstDrawNo ?? '—'})`
    );
  }
  console.log('```\n');
}

async function main(): Promise<void> {
  const apiUrl = (process.env.ACCUMULATED_BACKTEST_API_URL ?? DEFAULT_API).replace(/\/$/, '');
  const maxDrawsEnv = Number.parseInt(process.env.ACCUMULATED_BACKTEST_MAX_DRAWS ?? '', 10);
  const maxDrawsLimit = Number.isFinite(maxDrawsEnv) && maxDrawsEnv >= 2 ? maxDrawsEnv : null;
  const minDrawEnv = Number.parseInt(process.env.ACCUMULATED_BACKTEST_MIN_DRAW ?? '', 10);
  const minEvalDraw =
    Number.isFinite(minDrawEnv) && minDrawEnv >= 2 ? minDrawEnv : DEFAULT_MIN_EVAL_DRAW;

  const drawsDesc = await fetchDrawNumbers({ baseUrl: apiUrl });
  if (drawsDesc.length === 0) {
    console.error('조회 가능한 회차가 없습니다.');
    process.exitCode = 1;
    return;
  }

  const maxDraw = Math.max(...drawsDesc);
  const allRows = sortRowsAsc(await fetchWinningNumbersRange(maxDraw + 1, { baseUrl: apiUrl }));

  const chronological = [...drawsDesc].sort((a, b) => a - b);
  // 100회 미만 구간은 직전 누적이 빈약해 지표 왜곡이 크므로 평가에서 제외
  let toEvaluate = chronological.filter((d) => d >= minEvalDraw);
  if (maxDrawsLimit !== null) {
    toEvaluate = toEvaluate.slice(-maxDrawsLimit);
  }

  if (toEvaluate.length === 0) {
    console.error(
      `평가할 회차가 없습니다. (최대 회차 ${maxDraw}, 하한 ${minEvalDraw} — DB에 ${minEvalDraw}회 이상 데이터가 필요합니다.)`
    );
    process.exitCode = 1;
    return;
  }

  const strategyKeys = resolveStrategyKeys();
  const windowSizes = getDefaultBacktestWindowSizes({ maxWindowSize: EXTENDED_WINDOW_MAX });
  const { aggregates } = runAccumulatedNumbersBacktest({
    allRowsSortedAsc: allRows,
    drawNumbersToEvaluate: toEvaluate,
    windowSizes,
    strategyKeys,
  });

  console.log(`API: ${apiUrl}`);
  console.log(`전체 이력 행 수: ${allRows.length} (draw_no < ${maxDraw + 1})`);
  console.log(`평가 회차 수: ${toEvaluate.length} (회차 >= ${minEvalDraw}, 최신까지)`);
  console.log(`전략: ${strategyKeys.join(', ')} (전체 4종은 ACCUMULATED_BACKTEST_STRATEGIES=all)\n`);

  printTable(aggregates);

  const isFocusPair =
    strategyKeys.length === 2 &&
    strategyKeys.includes('nearestMean4') &&
    strategyKeys.includes('twoHotTwoCold');

  if (isFocusPair) {
    printTopWindowsByStrategy(aggregates, 'nearestMean4', 15, '평균 출현에 가장 가까운 4');
    printTopWindowsByStrategy(aggregates, 'twoHotTwoCold', 15, '상위 2 + 하위 2');
    printUiWindowPairComparison(aggregates);

    const finalMerged = runMergedFinalNumbersBacktest({
      allRowsSortedAsc: allRows,
      drawNumbersToEvaluate: toEvaluate,
      aggregates,
    });
    console.log('\n=== 최종 4개(전략별 2개 기간 통합) 백테스트 요약 ===\n');
    console.log(`평균근접 기간: ${finalMerged.shortWindows.join(', ')}`);
    console.log(`상2+하2 기간: ${finalMerged.longWindows.join(', ')}`);
    console.log(`최신 기준 예시 최종 4개: ${finalMerged.finalNumbersExample.join(', ')}`);
    console.log(`평가 회차: ${finalMerged.evaluatedRounds}`);
    console.log(`>=1 적중률: ${(finalMerged.atLeastOneRate * 100).toFixed(2)}%`);
    console.log(`평균 적중: ${finalMerged.avgHits.toFixed(3)}`);
    console.log(`최대 연속 미적중: ${finalMerged.maxMissStreak}회`);
  }

  const minEv = toEvaluate[0] ?? 0;
  const maxEv = toEvaluate[toEvaluate.length - 1] ?? 0;
  printMarkdownSnippet(aggregates, {
    apiUrl,
    minDraw: minEv,
    maxDraw: maxEv,
    evaluatedDrawCount: toEvaluate.length,
    windowCount: windowSizes.length,
    strategyKeys,
  });
}

void main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
