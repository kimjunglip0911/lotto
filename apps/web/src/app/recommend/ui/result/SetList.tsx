'use client';

import type { PositionRankLookup } from '@/app/recommend/helpers/positionRankLookup';
import {
  TECH_GAP_EXTRACT,
  TECH_ITEM_RANK,
  TECH_ZERO_COMBO,
  TECH_ZERO_GAP,
} from '@/app/recommend/helpers/techLabel';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import type { GapRankLookup } from '@/app/recommend/types/gapRank';
import { SetRankTable } from '@/app/recommend/ui/result/SetRankTable';

/** 생성된 추천 세트 목록(구간·순위·미추첨 기간·번호 표) */

type Props = {
  sets: GeneratedSet[];
  rankLookup: PositionRankLookup;
  gapLookup: GapRankLookup;
};

export const SetList = ({ sets, rankLookup, gapLookup }: Props) => {
  if (sets.length === 0) return null;
  return (
    <div className="pt-1 space-y-3">
      <p className="text-slate-100 font-semibold">생성된 추천 세트</p>
      <p className="text-[11px] text-slate-500">
        RANK1부터 5는 {TECH_GAP_EXTRACT}(1등부터), RANK6부터 10은 45등부터 역순, RANK11부터 17은{' '}
        {TECH_ITEM_RANK}, RANK18은 {TECH_ZERO_GAP}, RANK19부터 20은 {TECH_ZERO_COMBO}, RANK21부터 30은
        조합분석 8등부터 {TECH_ITEM_RANK}입니다.
        순위·미추첨 기간·미추첨 순위는 표 참고용이며, 번호는 1구~6구 뽑기 순서(num1~6)입니다.
        중복 조합 시 총 회차(drawCount)가 낮은 구간부터 1개 번호를 교체합니다.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {sets.map((set, index) => (
          <SetRankTable
            key={`${set.method}-${set.num1}-${set.num2}-${index}`}
            set={set}
            index={index}
            rankLookup={rankLookup}
            gapLookup={gapLookup}
          />
        ))}
      </div>
    </div>
  );
};
