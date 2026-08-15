'use client';

import { getStrategyBadge, getStrategyLabel } from '@/app/recommend/constants/resultView';
import { comboRankTitle } from '@/app/recommend/helpers/positionRankLookup';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

type Props = {
  set: GeneratedSet;
  index: number;
};

export function RankHead({ set, index }: Props) {
  const title = comboRankTitle(set.strategy);
  const badge = set.strategy ? getStrategyBadge(set.strategy) : '';
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-bold tracking-wide text-violet-200">{title}</p>
        {set.strategy ? (
          <p className="text-[10px] text-slate-400 truncate">{getStrategyLabel(set.strategy)}</p>
        ) : null}
      </div>
      {set.strategy ? (
        <span
          className={`shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold border ${badge}`}
        >
          {index + 1}번 세트
        </span>
      ) : (
        <span className="text-[10px] text-slate-500">{index + 1}번 세트</span>
      )}
    </div>
  );
}
