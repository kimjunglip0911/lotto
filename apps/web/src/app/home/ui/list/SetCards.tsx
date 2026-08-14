import type { LotterySetViewModel } from '../../types/home';
import { LotteryCard } from '../card/LotteryCard';
import { cardKey } from './grpView';

type Props = {
  sets: LotterySetViewModel[];
  start: number;
};

export function SetCards({ sets, start }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
      {sets.map((setInfo, index) => (
        <LotteryCard
          key={cardKey(setInfo, start + index)}
          setIndex={start + index}
          drawNo={setInfo.drawNo}
          numbers={setInfo.numbers}
          method={setInfo.method}
        />
      ))}
    </div>
  );
}
