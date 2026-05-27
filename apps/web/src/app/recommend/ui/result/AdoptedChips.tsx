'use client';

/** 통합 채택 번호 칩 */

type Props = {
  adoptedNumbers: number[];
  winningSet: Set<number>;
};

export const AdoptedChips = ({ adoptedNumbers, winningSet }: Props) => {
  if (adoptedNumbers.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        당첨번호 조회 후 채택이 계산되거나, 생성 실행 후 표시됩니다.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {[...adoptedNumbers].sort((a, b) => a - b).map((num) => (
        <span
          key={`adopted-${num}`}
          className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ${winningSet.has(num) ? 'bg-amber-400/90 text-slate-900 border border-amber-200' : 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/40'}`}
        >
          {num}
        </span>
      ))}
    </div>
  );
};
