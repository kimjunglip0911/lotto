'use client';

import {
  POSITION_SLOTS,
  rankAtPosition,
  type PositionRankLookup,
} from '@/app/recommend/helpers/positionRankLookup';
import { LotteryBall } from '@/components/ui/LotteryBall';
import { BALL_CLASS, CELL_CLASS, LABEL_CLASS } from './rankStyle';

type Props = {
  nums: readonly number[];
  rankLookup: PositionRankLookup;
};

export function RankBody({ nums, rankLookup }: Props) {
  return (
    <table className="w-full text-xs border-collapse">
      <tbody>
        <tr>
          <th scope="row" className={LABEL_CLASS}>구간</th>
          {POSITION_SLOTS.map((slot) => (
            <td key={`slot-${slot}`} className={CELL_CLASS}>{slot}</td>
          ))}
        </tr>
        <tr>
          <th scope="row" className={LABEL_CLASS}>순위</th>
          {POSITION_SLOTS.map((slot, i) => (
            <td key={`rank-${slot}`} className={`${CELL_CLASS} text-sky-300`}>
              {rankAtPosition(rankLookup, slot, nums[i]!) ?? '—'}
            </td>
          ))}
        </tr>
        <tr>
          <th scope="row" className={LABEL_CLASS}>번호</th>
          {nums.map((num, i) => (
            <td key={`num-${i}`} className={BALL_CLASS}>
              <div className="flex items-center justify-center">
                <LotteryBall num={num} />
              </div>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
