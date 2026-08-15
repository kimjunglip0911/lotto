'use client';

import { numsFromSet, type PositionRankLookup } from '@/app/recommend/helpers/positionRankLookup';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import { RankBody } from '@/app/recommend/ui/result/RankBody';
import { RankHead } from '@/app/recommend/ui/result/RankHead';

type Props = {
  set: GeneratedSet;
  index: number;
  rankLookup: PositionRankLookup;
};

export function SetRankTable({ set, index, rankLookup }: Props) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3 space-y-2">
      <RankHead set={set} index={index} />
      <div className="overflow-x-auto">
        <RankBody nums={numsFromSet(set)} rankLookup={rankLookup} />
      </div>
    </div>
  );
}
