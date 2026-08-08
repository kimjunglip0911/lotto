import { LotteryBall } from '@/components/ui/LotteryBall';

type BucketSectionProps = {
  title: string;
  numbers: number[];
};

/** 출현 횟수 한 그룹의 제목·개수·번호 공을 표시한다. */
export function BucketSection({ title, numbers }: BucketSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <span className="text-xs text-slate-400">{numbers.length}개</span>
      </div>
      {numbers.length === 0 ? (
        <p className="text-sm text-slate-500">해당 번호 없음</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {numbers.map((num) => (
            <LotteryBall key={num} num={num} />
          ))}
        </div>
      )}
    </section>
  );
}
