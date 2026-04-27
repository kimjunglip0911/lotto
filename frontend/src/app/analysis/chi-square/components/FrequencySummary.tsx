import type { ChiSquareResult } from '../types';

type Props = {
  lowFreqNumbers: ChiSquareResult[];
  highFreqNumbers: ChiSquareResult[];
  excludedNumbers: ChiSquareResult[];
};

export function FrequencySummary({ lowFreqNumbers, highFreqNumbers, excludedNumbers }: Props) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-2">
        <h4 className="text-sm font-semibold text-rose-300">저빈도 판정 번호 ({lowFreqNumbers.length}개)</h4>
        {lowFreqNumbers.length === 0 ? (
          <p className="text-xs text-slate-400">유의미한 저빈도 번호가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {lowFreqNumbers.map((r) => (
              <span
                key={r.number}
                className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-rose-500/25 px-2 text-sm font-bold text-rose-200"
              >
                {r.number}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-2">
        <h4 className="text-sm font-semibold text-blue-300">고빈도 판정 번호 ({highFreqNumbers.length}개)</h4>
        {highFreqNumbers.length === 0 ? (
          <p className="text-xs text-slate-400">유의미한 고빈도 번호가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {highFreqNumbers.map((r) => (
              <span
                key={r.number}
                className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-blue-500/25 px-2 text-sm font-bold text-blue-200"
              >
                {r.number}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4 space-y-2">
        <h4 className="text-sm font-semibold text-orange-300">제외 번호 — 상위 5% ({excludedNumbers.length}개)</h4>
        <p className="text-[11px] text-slate-500 leading-snug">편차 상위 5% 이상으로 과출현한 번호입니다.</p>
        {excludedNumbers.length === 0 ? (
          <p className="text-xs text-slate-400">해당 번호가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {excludedNumbers.map((r) => (
              <span
                key={r.number}
                className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-orange-500/25 px-2 text-sm font-bold text-orange-200"
              >
                {r.number}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
