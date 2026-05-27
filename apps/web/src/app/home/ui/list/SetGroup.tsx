/** 10세트 단위 카드 그룹과 PNG 다운로드 버튼 */

import type { LotterySetViewModel } from '../../types/home';
import { LotteryCard } from '../card/LotteryCard';

interface SetGroupProps {
  groupIndex: number;
  groupSets: LotterySetViewModel[];
  groupSize: number;
  status: 'success' | 'error' | null;
  captureRef: (node: HTMLDivElement | null) => void;
  onDownload: () => void;
}

const btnLabel = (status: SetGroupProps['status']) =>
  status === 'success' ? '다운로드 완료' : status === 'error' ? '다운로드 실패' : '10세트 다운로드';

export function SetGroup({ groupIndex, groupSets, groupSize, status, captureRef, onDownload }: SetGroupProps) {
  const start = groupIndex * groupSize;
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-200">
          {start + 1}~{start + groupSets.length}세트
        </h4>
        <button
          type="button"
          onClick={onDownload}
          className="rounded-md border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/25"
        >
          {btnLabel(status)}
        </button>
      </div>
      <div ref={captureRef} className="rounded-xl bg-slate-950/35 p-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {groupSets.map((setInfo, index) => (
            <LotteryCard
              key={setInfo.id ?? `${setInfo.drawNo}-${setInfo.numbers.join('-')}-${start + index}`}
              setIndex={start + index}
              drawNo={setInfo.drawNo}
              numbers={setInfo.numbers}
              method={setInfo.method}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
