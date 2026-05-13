import type { FinalNumberPlan } from '../types';
import { AccStratPick } from './AccStratPick';

/** 평균근접으로 고른 전략별 번호와 최종 채택 4개를 카드 형태로 보여 줍니다. */

type Props = {
  plan: FinalNumberPlan;
  hasSearched: boolean;
  drawNo: number;
  mainWinSet: ReadonlySet<number>;
};

export const AccFinalBox = ({ plan, hasSearched, drawNo, mainWinSet }: Props) => {
  const showHit = hasSearched && drawNo > 1;
  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-4">
      <h3 className="text-base font-semibold text-slate-100">평균근접 채택 4개 (2년 · 전체)</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {plan.strategyPicks.map((pick) => (
          <AccStratPick key={pick.strategyKey} pick={pick} showHit={showHit} mainWinSet={mainWinSet} />
        ))}
      </div>

      <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 space-y-2">
        <p className="text-sm font-semibold text-emerald-300">최종 채택 4개</p>
        <div className="flex flex-wrap gap-2">
          {plan.finalNumbers.map((n) => (
            <span
              key={`final-${n}`}
              className="px-2 py-1 rounded-md text-xs font-semibold bg-emerald-400/30 text-emerald-200"
            >
              {n}
            </span>
          ))}
        </div>
        <p className="text-xs text-emerald-100/90">저장·스냅샷 기준 채택 번호는 전체 기간 평균근접 4개와 동일합니다.</p>
      </div>
    </section>
  );
};
