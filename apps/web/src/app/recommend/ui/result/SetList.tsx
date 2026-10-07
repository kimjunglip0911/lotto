'use client';

import { parseComboStrategyRank } from '@/app/recommend/logic/combo/orderSets';
import { slotWinKey } from '@/app/recommend/logic/combo/slotWin';
import type { WinLookups } from '@/app/recommend/logic/combo/winLookup';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import { SetRankTable } from '@/app/recommend/ui/result/SetRankTable';

/** 생성된 추천 세트 목록(구간·순위·번호 표) */

type Props = {
  sets: GeneratedSet[];
  rankLookup: WinLookups;
};

export const SetList = ({ sets, rankLookup }: Props) => {
  if (sets.length === 0) return null;
  return (
    <div className="pt-1 space-y-3">
      <p className="text-slate-100 font-semibold">생성된 추천 세트</p>
      <p className="text-[11px] text-slate-500">
        1~10세트는 1년, 11~20세트는 3년, 21~30세트는 전체의 1~10등입니다.
        제외 번호면 다음 등수로 넘기고, 10등 다음은 1등부터 다시 갑니다.
        표의 순위는 해당 기간 기준이며, 번호는 1구~6구 순서입니다.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {sets.map((set, index) => (
          <SetRankTable
            key={`${set.method}-${set.num1}-${set.num2}-${index}`}
            set={set}
            index={index}
            rankLookup={rankLookup[slotWinKey(parseComboStrategyRank(set.strategy))]}
          />
        ))}
      </div>
    </div>
  );
};
