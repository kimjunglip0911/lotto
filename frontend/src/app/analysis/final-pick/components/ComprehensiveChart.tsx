'use client';

import { useMemo } from 'react';
import { toChartStats, type AccumulatedBarChartStats } from '@/app/analysis/accu-nums/components/chart/accBarStat';

type ComprehensiveChartProps = {
  /** 이전 회차까지 본번호 누적 출현 횟수(길이 45, 인덱스 0 = 1번). */
  counts: number[];
  /** 집계에 포함된 회차 수 — 평균선·비율 계산에 사용 */
  analyzedDrawCountForChart: number;
  /** 통합 채택 번호(강조 색상 적용) */
  highlightedNumbers?: Set<number>;
  /** 누적 출현 극값 기준 후보 제외 — 막대 위 앰버 동그라미 */
  accumulatedExcludedNumbers?: number[];
  /** 카이제곱 워크포워드 제외 번호(조건부 확률·겹침 회차) — 막대 위 빨간 동그라미 */
  chiSquareWalkForwardExcludedNumbers?: number[];
  /** 연속 미출현 분석 제외 번호 — 막대 위 하늘색 동그라미 */
  streakExcludedNumbers?: number[];
};

const NUMBER_RANGE = Array.from({ length: 45 }, (_, i) => i + 1);

type ExclusionMarkersProps = {
  number: number;
  streakSet: Set<number>;
  accumulatedSet: Set<number>;
  chiSquareExcludedSet: Set<number>;
};

/** 위에서 아래: 연속 → 카이제곱 제외 → 누적 제외(막대에 가장 가까움). */
function ExclusionMarkers({ number, streakSet, accumulatedSet, chiSquareExcludedSet }: ExclusionMarkersProps) {
  const streak = streakSet.has(number);
  const accumulated = accumulatedSet.has(number);
  const chiExcluded = chiSquareExcludedSet.has(number);
  const hasAny = streak || accumulated || chiExcluded;
  return (
    <div
      className="flex h-[26px] shrink-0 flex-col items-center justify-end gap-0.5"
      aria-hidden={!hasAny}
    >
      {streak ? (
        <span
          className="block size-1.5 shrink-0 rounded-full bg-sky-400"
          aria-label="연속 미출현 분석 후보 제외"
        />
      ) : null}
      {chiExcluded ? (
        <span
          className="block size-1.5 shrink-0 rounded-full bg-red-500"
          aria-label="카이제곱 검정 워크포워드 후보 제외"
        />
      ) : null}
      {accumulated ? (
        <span
          className="block size-1.5 shrink-0 rounded-full bg-amber-400"
          aria-label="누적 번호 분석 후보 제외"
        />
      ) : null}
    </div>
  );
}

/**
 * 1~45번을 가로로 나열한 종합 막대 차트(이전 회차까지 누적 출현).
 *
 * - 집계 회차가 없을 때는 회색 빈 막대 + 안내 문구를 보여 자리만 잡는다.
 * - 막대 토큰(`w-8`, `h-[145px]`)은 누적 분석 `AccuChart`와 동일하게 맞춘다.
 * - 카이제곱 워크포워드 제외·연속·누적 제외는 막대 위 동그라미로 표시한다.
 */
export function ComprehensiveChart({
  counts,
  analyzedDrawCountForChart,
  highlightedNumbers,
  accumulatedExcludedNumbers,
  chiSquareWalkForwardExcludedNumbers,
  streakExcludedNumbers,
}: ComprehensiveChartProps) {
  const hasData = counts.length === 45 && analyzedDrawCountForChart > 0;
  const emptyStats: AccumulatedBarChartStats = {
    averageCount: 0,
    averageLineBottomPx: 0,
    chartRows: [],
  };
  const { averageCount, averageLineBottomPx, chartRows } = hasData
    ? toChartStats(counts, analyzedDrawCountForChart)
    : emptyStats;

  const accumulatedExcludedSet = useMemo(
    () => new Set(accumulatedExcludedNumbers ?? []),
    [accumulatedExcludedNumbers],
  );
  const chiSquareExcludedSet = useMemo(
    () => new Set(chiSquareWalkForwardExcludedNumbers ?? []),
    [chiSquareWalkForwardExcludedNumbers],
  );
  const streakSet = useMemo(() => new Set(streakExcludedNumbers ?? []), [streakExcludedNumbers]);

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-2.5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="text-xl font-semibold text-white">번호별 종합 분석 차트 (1~45)</h3>
        <span className="text-xs text-slate-400">누적 출현(이전 회차까지)</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-1.5 shrink-0 rounded-full bg-red-500" />
          카이제곱 제외
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-1.5 shrink-0 rounded-full bg-amber-400" />
          누적 제외
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-1.5 shrink-0 rounded-full bg-sky-400" />
          연속 제외
        </span>
      </div>

      {hasData ? (
        <div className="overflow-x-auto pb-0.5">
          <div className="relative w-max">
            <div
              className="pointer-events-none absolute inset-x-0"
              style={{ bottom: `${averageLineBottomPx}px` }}
            >
              <div className="w-full border-t-[3px] border-rose-400/90" />
              <span className="absolute -top-5 right-0 rounded bg-rose-500/20 px-2 py-0.5 text-[11px] font-medium text-rose-300">
                평균 {averageCount.toFixed(1)}회
              </span>
            </div>
            <ul className="flex h-[200px] w-max items-end gap-1">
              {chartRows.map((item) => {
                const isHighlighted = highlightedNumbers?.has(item.number) ?? false;
                return (
                  <li
                    key={`comprehensive-${item.number}`}
                    className="flex w-8 shrink-0 flex-col items-center gap-1"
                  >
                    <span className="text-[11px] leading-none text-slate-100 tabular-nums">{item.count}</span>
                    <ExclusionMarkers
                      number={item.number}
                      streakSet={streakSet}
                      accumulatedSet={accumulatedExcludedSet}
                      chiSquareExcludedSet={chiSquareExcludedSet}
                    />
                    <div className="flex h-[145px] w-full items-end overflow-hidden rounded-md border border-white/10 bg-slate-900/70">
                      <div
                        className={`w-full ${isHighlighted ? 'bg-rose-500/90' : 'bg-primary/80'}`}
                        style={{ height: `${Math.max(item.ratio, item.count > 0 ? 2 : 0)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium leading-none text-slate-300">{item.number}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="overflow-x-auto pb-0.5">
            <ul className="flex h-[200px] w-max items-end gap-1">
              {NUMBER_RANGE.map((number) => (
                <li
                  key={`comprehensive-empty-${number}`}
                  className="flex w-8 shrink-0 flex-col items-center gap-1"
                >
                  <span className="text-[11px] leading-none text-slate-500 tabular-nums">·</span>
                  <ExclusionMarkers
                    number={number}
                    streakSet={streakSet}
                    accumulatedSet={accumulatedExcludedSet}
                    chiSquareExcludedSet={chiSquareExcludedSet}
                  />
                  <div className="h-[145px] w-full rounded-md border border-dashed border-white/10 bg-slate-900/40" />
                  <span className="text-[11px] font-medium leading-none text-slate-500">{number}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-400">
            기준 회차 조회 후 1~45번 누적 출현 횟수가 표시됩니다(2회차부터 이전 회차 집계).
          </p>
        </div>
      )}
    </section>
  );
}
