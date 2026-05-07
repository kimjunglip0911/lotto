'use client';

import type { AccumulatedExclusionResult } from '../logic/accumulatedAdoption';

type AccumulatedExclusionCardProps = {
  exclusion: AccumulatedExclusionResult;
  mainWinningSet?: Set<number>;
};

const chipBase =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-bold';
const chipRose = 'bg-rose-400/20 text-rose-100';
const chipHit =
  'bg-amber-400 text-slate-900 ring-1 ring-amber-200/90 shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)]';

function NumberChip({ n, mainWinningSet }: { n: number | null; mainWinningSet?: Set<number> }) {
  if (n === null) {
    return (
      <span className={`${chipBase} border border-dashed border-rose-300/30 bg-slate-900/40 text-rose-200/50`}>
        —
      </span>
    );
  }
  const hit = mainWinningSet?.has(n) ?? false;
  return (
    <span className={hit ? `${chipBase} ${chipHit}` : `${chipBase} ${chipRose}`}>{n}</span>
  );
}

/**
 * 통합 분석용: 누적 출현 극값 제외 — 2년(왼쪽)·전체(오른쪽) 2열.
 */
export function AccumulatedExclusionCard({ exclusion, mainWinningSet }: AccumulatedExclusionCardProps) {
  const hasAny =
    exclusion.twoYearHighest !== null ||
    exclusion.twoYearLowest !== null ||
    exclusion.allTimeHighest !== null ||
    exclusion.allTimeLowest !== null;

  return (
    <section className="rounded-2xl border border-rose-400/30 bg-rose-500/5 p-4 space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-rose-200">
          누적 번호 분석 — 후보 제외
          <span className="ml-2 text-xs font-medium text-slate-300">슬롯 기준 최대 4개(고유)</span>
        </h3>
        <p className="text-xs font-medium text-rose-100/80 leading-relaxed">
          직전 104회(2년)·전체 구간 각 출현 횟수 최다 1·최소 1. 동률 시 번호가 작은 쪽. 슬롯이 겹치면 고유 번호는 4개 미만일 수 있습니다.
        </p>
      </div>

      {hasAny ? (
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <div className="space-y-3 rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">2년 (직전 104회)</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 w-10 shrink-0">최다</span>
              <NumberChip n={exclusion.twoYearHighest} mainWinningSet={mainWinningSet} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 w-10 shrink-0">최소</span>
              <NumberChip n={exclusion.twoYearLowest} mainWinningSet={mainWinningSet} />
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">전체</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 w-10 shrink-0">최다</span>
              <NumberChip n={exclusion.allTimeHighest} mainWinningSet={mainWinningSet} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 w-10 shrink-0">최소</span>
              <NumberChip n={exclusion.allTimeLowest} mainWinningSet={mainWinningSet} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <span
                key={`acc-ex-empty-${idx}`}
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-dashed border-rose-300/30 bg-slate-900/40 px-2 text-sm font-semibold text-rose-200/40"
              >
                ·
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400">기준 회차 조회 후 표시됩니다.</p>
        </div>
      )}

      {exclusion.excludedUnique.length > 0 ? (
        <div className="border-t border-rose-400/20 pt-3 space-y-2">
          <p className="text-xs font-medium text-rose-200/90">통합 필터에 쓰는 고유 제외 번호</p>
          <div className="flex flex-wrap gap-2">
            {exclusion.excludedUnique.map((n) => {
              const hit = mainWinningSet?.has(n) ?? false;
              return (
                <span
                  key={`acc-ex-uniq-${n}`}
                  className={
                    hit
                      ? `${chipBase} ${chipHit}`
                      : `${chipBase} border border-rose-300/40 bg-rose-500/15 text-rose-50`
                  }
                >
                  {n}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
