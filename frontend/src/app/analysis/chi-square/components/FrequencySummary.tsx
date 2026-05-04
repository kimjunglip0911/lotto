import type { ChiSquareResult } from '../types';

type Props = {
  lowFreqNumbers: ChiSquareResult[];
  highFreqNumbers: ChiSquareResult[];
};

export function FrequencySummary({ lowFreqNumbers, highFreqNumbers }: Props) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </section>
  );
}
