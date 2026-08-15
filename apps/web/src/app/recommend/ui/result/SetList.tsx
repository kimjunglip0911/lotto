'use client';

import type { PositionRankLookup } from '@/app/recommend/helpers/positionRankLookup';
import { TECH_ITEM_RANK } from '@/app/recommend/helpers/techLabel';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import { SetRankTable } from '@/app/recommend/ui/result/SetRankTable';

/** 생성된 추천 세트 목록(구간·순위·번호 표) */

type Props = {
  sets: GeneratedSet[];
  rankLookup: PositionRankLookup;
};

export const SetList = ({ sets, rankLookup }: Props) => {
  if (sets.length === 0) return null;
  return (
    <div className="pt-1 space-y-3">
      <p className="text-slate-100 font-semibold">생성된 추천 세트</p>
      <p className="text-[11px] text-slate-500">
        RANK1부터 30은 {TECH_ITEM_RANK}입니다. RANK N은 조합분석 N등 자리대부터 고릅니다.
        표의 순위는 참고용이며, 번호는 1구~6구 뽑기 순서(num1~6)입니다.
        중복 조합 시 총 회차(drawCount)가 낮은 구간부터 1개 번호를 교체합니다.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {sets.map((set, index) => (
          <SetRankTable
            key={`${set.method}-${set.num1}-${set.num2}-${index}`}
            set={set}
            index={index}
            rankLookup={rankLookup}
          />
        ))}
      </div>
    </div>
  );
};
