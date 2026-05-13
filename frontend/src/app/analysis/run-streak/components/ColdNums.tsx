'use client';

import { useMemo } from 'react';
import type { StreakResult } from '../types';

// 평균보다 긴 연속 출현(본번호)을 가진 번호만 모아 표시합니다.

type ColdNumsProps = {
  coldNumbers: StreakResult[];
  averageStreak: number;
};

export const ColdNums = ({ coldNumbers, averageStreak }: ColdNumsProps) => {
  const sortedCold = useMemo(
    () => [...coldNumbers].sort((a, b) => b.streak - a.streak),
    [coldNumbers],
  );

  return (
    <section className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4 space-y-2">
      <h4 className="text-sm font-semibold text-orange-300">
        평균 초과 연속 출현 ({coldNumbers.length}개)
      </h4>
      <p className="text-[11px] text-slate-500 leading-snug">
        표시값은 연속으로 본번호에 나온 회차 수에서 1을 뺀 값입니다. 전체 평균({averageStreak.toFixed(1)})보다 큰 번호입니다.
      </p>
      {coldNumbers.length === 0 ? (
        <p className="text-xs text-slate-400">해당 번호가 없습니다.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedCold.map((r) => (
            <span
              key={r.number}
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-orange-500/25 px-2 text-sm font-bold text-orange-200"
              title={`연속 출현 점수 ${r.streak} (N회 연속 출현이면 점수 N−1)`}
            >
              {r.number}
            </span>
          ))}
        </div>
      )}
    </section>
  );
};
