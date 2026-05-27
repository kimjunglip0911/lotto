'use client';

import { getStrategyBadge, getStrategyLabel } from '@/app/recommend/constants/resultView';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

/** 생성된 추천 세트 목록 */

export const SetList = ({ sets }: { sets: GeneratedSet[] }) => {
  if (sets.length === 0) return null;
  return (
    <div className="pt-1 space-y-2">
      <p className="text-slate-100 font-semibold">생성된 추천 세트</p>
      <ul className="space-y-1.5">
        {sets.map((set, index) => (
          <li
            key={`${set.method}-${set.num1}-${set.num2}-${index}`}
            className="flex items-center gap-2 text-slate-200"
          >
            <span className="w-6 text-right text-xs text-slate-500 shrink-0">{index + 1}.</span>
            <span>
              {set.num1}, {set.num2}, {set.num3}, {set.num4}, {set.num5}, {set.num6}
            </span>
            {set.strategy ? (
              <span
                className={`ml-auto shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold border ${getStrategyBadge(set.strategy)}`}
              >
                {getStrategyLabel(set.strategy)}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
};
