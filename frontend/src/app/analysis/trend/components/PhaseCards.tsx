import { PHASE_META } from '../constants';
import type { NumberTrendResult, TrendPhase } from '../types';

type Props = {
  phaseGroups: Record<TrendPhase, NumberTrendResult[]>;
};

export function PhaseCards({ phaseGroups }: Props) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {(Object.entries(phaseGroups) as [TrendPhase, NumberTrendResult[]][]).map(([phase, numbers]) => {
        const meta = PHASE_META[phase];
        return (
          <div key={phase} className={`rounded-2xl border ${meta.borderClass} ${meta.bgClass} p-4 space-y-2`}>
            <h4 className={`text-sm font-semibold ${meta.textClass}`}>
              {meta.label} ({numbers.length}개)
            </h4>
            {numbers.length === 0 ? (
              <p className="text-xs text-slate-400">{meta.label} 번호가 없습니다.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {numbers.map((r) => (
                  <span
                    key={r.number}
                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-bold ${meta.badgeClass}`}
                  >
                    {r.number}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
