import type { StreakResult } from '../types';

type ColdNumbersSectionProps = {
  coldNumbers: StreakResult[];
  averageStreak: number;
};

export const ColdNumbersSection = ({ coldNumbers, averageStreak }: ColdNumbersSectionProps) => (
  <section className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4 space-y-2">
    <h4 className="text-sm font-semibold text-orange-300">
      저빈도 후보 — 평균 미출현 기간 초과 ({coldNumbers.length}개)
    </h4>
    <p className="text-[11px] text-slate-500 leading-snug">
      선택 회차 기준 평균({averageStreak.toFixed(1)}회차)을 초과하여 연속으로 출현하지 않은 번호입니다.
    </p>
    {coldNumbers.length === 0 ? (
      <p className="text-xs text-slate-400">해당 번호가 없습니다.</p>
    ) : (
      <div className="flex flex-wrap gap-2">
        {coldNumbers
          .slice()
          .sort((a, b) => b.streak - a.streak)
          .map((r) => (
            <span
              key={r.number}
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-orange-500/25 px-2 text-sm font-bold text-orange-200"
              title={`${r.streak}회차 미출현`}
            >
              {r.number}
            </span>
          ))}
      </div>
    )}
  </section>
);
