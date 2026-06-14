'use client';

import {
  comboRankTitle,
  numsFromSet,
  POSITION_SLOTS,
  rankAtPosition,
  type PositionRankLookup,
} from '@/app/recommend/helpers/positionRankLookup';
import { getStrategyBadge } from '@/app/recommend/constants/resultView';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import { LotteryBall } from '@/components/ui/LotteryBall';

type Props = {
  set: GeneratedSet;
  index: number;
  rankLookup: PositionRankLookup;
};

const cellClass =
  'py-1 px-2 text-center tabular-nums text-slate-200 border border-white/[0.08] min-w-[2rem]';
const ballCellClass =
  'py-1.5 px-1 text-center border border-white/[0.08] min-w-[2.25rem]';
const labelClass =
  'py-1 px-2 text-right text-xs font-medium text-slate-400 border border-white/[0.08] whitespace-nowrap bg-slate-900/40';

export function SetRankTable({ set, index, rankLookup }: Props) {
  const nums = numsFromSet(set);
  const title = comboRankTitle(set.strategy);
  const badge = set.strategy ? getStrategyBadge(set.strategy) : '';

  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold tracking-wide text-violet-200">{title}</p>
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
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <tbody>
            <tr>
              <th scope="row" className={labelClass}>
                구간
              </th>
              {POSITION_SLOTS.map((slot) => (
                <td key={`slot-${slot}`} className={cellClass}>
                  {slot}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className={labelClass}>
                순위
              </th>
              {POSITION_SLOTS.map((slot, i) => {
                const rank = rankAtPosition(rankLookup, slot, nums[i]!);
                return (
                  <td key={`rank-${slot}`} className={`${cellClass} text-sky-300`}>
                    {rank ?? '—'}
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row" className={labelClass}>
                번호
              </th>
              {nums.map((num, i) => (
                <td key={`num-${i}`} className={ballCellClass}>
                  <div className="flex items-center justify-center">
                    <LotteryBall num={num} />
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
