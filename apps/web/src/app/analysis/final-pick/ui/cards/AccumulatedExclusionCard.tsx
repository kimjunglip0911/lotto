'use client';

import type { AccumulatedExclusionResult } from '../../logic/accuAdopt';
import { AccuExclCol } from './AccuExclCol';
import { AccuExclEmpty } from './AccuExclEmpty';

type Props = { exclusion: AccumulatedExclusionResult; mainWinningSet?: Set<number> };

/** 통합 분석용 누적 출현 극값 제외 — 2년·전체 2열. */
export function AccumulatedExclusionCard({ exclusion, mainWinningSet }: Props) {
  const hasAny =
    exclusion.twoYearHighest !== null ||
    exclusion.twoYearLowest !== null ||
    exclusion.allTimeHighest !== null ||
    exclusion.allTimeLowest !== null;

  return (
    <section className="rounded-2xl border border-rose-400/30 bg-rose-500/5 p-4 space-y-4">
      <h3 className="text-base font-semibold text-rose-200 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span>누적 번호 분석 — 후보 제외</span>
        <span className="text-xs font-medium text-slate-300">슬롯 기준 최대 4개(고유)</span>
        <span className="text-xs font-medium text-rose-100/80">2년·전체 각 최다·최소 1</span>
      </h3>
      {hasAny ? (
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <AccuExclCol
            label="2년 (직전 104회)"
            highest={exclusion.twoYearHighest}
            lowest={exclusion.twoYearLowest}
            mainWinningSet={mainWinningSet}
          />
          <AccuExclCol
            label="전체"
            highest={exclusion.allTimeHighest}
            lowest={exclusion.allTimeLowest}
            mainWinningSet={mainWinningSet}
          />
        </div>
      ) : (
        <AccuExclEmpty />
      )}
    </section>
  );
}
