'use client';

import { useMemo } from 'react';
import type { ChiSquareChartDatum } from '../logic/chiSquareAdoption';

type ComprehensiveChartProps = {
  /** 1~45번 번호별 카이제곱 편차(O-E) 및 순위 데이터. */
  chartData: ChiSquareChartDatum[];
  /** 통합 채택 번호(강조 색상 적용) */
  highlightedNumbers?: Set<number>;
  /** 누적 번호 분석 채택 번호 — 막대 외곽 주황색 테두리 */
  accumulatedAdoptedNumbers?: number[];
  /** 카이제곱 검정 채택 번호 — 막대 외곽 빨간색 테두리(누적과 동시 해당 시 우선) */
  chiSquareAdoptedNumbers?: number[];
  /** 추세 분석 제외 번호 — 막대 위 파란 동그라미 */
  trendExcludedNumbers?: number[];
  /** 연속 미출현 분석 제외 번호 — 막대 위 하늘색 동그라미 */
  streakExcludedNumbers?: number[];
};

const NUMBER_RANGE = Array.from({ length: 45 }, (_, i) => i + 1);

/** 막대 영역 항상 border-2 폭 유지. 카이제곱이 누적보다 우선(동시 해당 시 빨강). 로직상 채택 집합은 배타적이지만 예외 시에도 동일 규칙 적용. */
function getAdoptionBorderClass(
  number: number,
  chiSquareSet: Set<number>,
  accumulatedSet: Set<number>,
): string {
  if (chiSquareSet.has(number)) return 'border-red-500';
  if (accumulatedSet.has(number)) return 'border-orange-400';
  return 'border-transparent';
}

type ExclusionMarkersProps = {
  number: number;
  trendSet: Set<number>;
  streakSet: Set<number>;
};

/** 추세(파랑)·연속 미출현(하늘색) 제외 마커. 둘 다 해당 시 세로 stack(파랑 위). */
function ExclusionMarkers({ number, trendSet, streakSet }: ExclusionMarkersProps) {
  const trend = trendSet.has(number);
  const streak = streakSet.has(number);
  return (
    <div
      className="flex h-[14px] shrink-0 flex-col items-center justify-end gap-0.5"
      aria-hidden={!trend && !streak}
    >
      {trend ? (
        <span
          className="block size-1.5 shrink-0 rounded-full bg-blue-500"
          aria-label="추세 분석 후보 제외"
        />
      ) : null}
      {streak ? (
        <span
          className="block size-1.5 shrink-0 rounded-full bg-sky-400"
          aria-label="연속 미출현 분석 후보 제외"
        />
      ) : null}
    </div>
  );
}

/**
 * 1~45번을 가로로 나열한 종합 막대 차트.
 *
 * - 데이터가 비어 있을 때는 회색 빈 막대 + 안내 문구를 보여 자리만 잡는다.
 * - 막대 토큰(`w-8`, `h-[145px]`)은 누적 분석의 `AccumulatedChartSection`과 동일하게 맞춰
 *   향후 실데이터를 주입했을 때 시각 일관성이 유지되도록 한다.
 *
 * 기법별 표시: 누적/카이제곱 채택은 막대 외곽 테두리, 추세/연속 미출현 제외는 막대 위 동그라미.
 */
export function ComprehensiveChart({
  chartData,
  highlightedNumbers,
  accumulatedAdoptedNumbers,
  chiSquareAdoptedNumbers,
  trendExcludedNumbers,
  streakExcludedNumbers,
}: ComprehensiveChartProps) {
  const hasData = chartData.length === 45;
  const maxAbsDeviation = hasData ? Math.max(...chartData.map((row) => Math.abs(row.deviation)), 1) : 1;
  const sortedByRank = hasData ? [...chartData].sort((a, b) => a.rank - b.rank || a.number - b.number) : [];

  const accumulatedSet = useMemo(
    () => new Set(accumulatedAdoptedNumbers ?? []),
    [accumulatedAdoptedNumbers],
  );
  const chiSquareSet = useMemo(
    () => new Set(chiSquareAdoptedNumbers ?? []),
    [chiSquareAdoptedNumbers],
  );
  const trendSet = useMemo(() => new Set(trendExcludedNumbers ?? []), [trendExcludedNumbers]);
  const streakSet = useMemo(() => new Set(streakExcludedNumbers ?? []), [streakExcludedNumbers]);

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-2.5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="text-xl font-semibold text-white">번호별 종합 분석 차트 (1~45)</h3>
        <span className="text-xs text-slate-400">카이제곱 편차(O-E) 기준</span>
      </div>

      {hasData ? (
        <div className="overflow-x-auto pb-0.5">
          <div className="relative w-max">
            <ul className="flex h-[218px] w-max items-end gap-1">
              {sortedByRank.map((row) => {
                const number = row.number;
                const deviation = row?.deviation ?? 0;
                const rank = row?.rank ?? number;
                const normalizedHeight = (Math.abs(deviation) / maxAbsDeviation) * 50;
                const barHeight = Math.max(normalizedHeight, deviation !== 0 ? 2 : 0);
                const isHighlighted = highlightedNumbers?.has(number) ?? false;
                const borderAccent = getAdoptionBorderClass(number, chiSquareSet, accumulatedSet);

                return (
                  <li key={`comprehensive-${number}`} className="flex w-8 shrink-0 flex-col items-center gap-1">
                    <span className="text-[11px] leading-none text-slate-100 tabular-nums">
                      {deviation.toFixed(2)}
                    </span>
                    <ExclusionMarkers number={number} trendSet={trendSet} streakSet={streakSet} />
                    <div
                      className={`relative h-[145px] w-full overflow-hidden rounded-md border-2 bg-slate-900/70 ${borderAccent}`}
                    >
                      <div className="absolute inset-x-0 top-1/2 h-px bg-white/20" />
                      <div
                        className={`absolute inset-x-0 ${isHighlighted ? 'bg-yellow-300/95' : 'bg-lime-400/90'}`}
                        style={
                          deviation >= 0
                            ? { height: `${barHeight}%`, bottom: '50%' }
                            : { height: `${barHeight}%`, top: '50%' }
                        }
                      />
                    </div>
                    <span className="text-[11px] font-medium leading-none text-slate-300">{number}</span>
                    <span className="text-[11px] leading-none text-slate-400">{rank}등</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="overflow-x-auto pb-0.5">
            <ul className="flex h-[218px] w-max items-end gap-1">
              {NUMBER_RANGE.map((number) => (
                <li
                  key={`comprehensive-empty-${number}`}
                  className="flex w-8 shrink-0 flex-col items-center gap-1"
                >
                  <span className="text-[11px] leading-none text-slate-500 tabular-nums">·</span>
                  <ExclusionMarkers number={number} trendSet={trendSet} streakSet={streakSet} />
                  <div className="h-[145px] w-full rounded-md border-2 border-dashed border-white/10 bg-slate-900/40" />
                  <span className="text-[11px] font-medium leading-none text-slate-500">{number}</span>
                  <span className="text-[11px] leading-none text-slate-600">-등</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-400">
            기준 회차 조회 후 1~45번 편차(O-E)와 카이제곱 기준 순위가 표시됩니다.
          </p>
        </div>
      )}
    </section>
  );
}
