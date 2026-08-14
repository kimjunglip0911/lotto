'use client';

import { grpLabel } from '../../logic/grpLabel';
import type { LotterySetViewModel } from '../../types/home';
import { grpBtnLabel, grpStart } from './grpView';
import { SetCards } from './SetCards';

type Props = {
  groupIndex: number;
  groupSets: LotterySetViewModel[];
  groupSize: number;
  status: 'success' | 'error' | null;
  captureRef: (node: HTMLDivElement | null) => void;
  onDownload: () => void;
};

export function SetGroup({
  groupIndex,
  groupSets,
  groupSize,
  status,
  captureRef,
  onDownload,
}: Props) {
  const start = grpStart(groupIndex, groupSize);
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-200">
          {grpLabel(groupIndex, groupSize)}
        </h4>
        <button
          type="button"
          onClick={onDownload}
          className="rounded-md border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/25"
        >
          {grpBtnLabel(status)}
        </button>
      </div>
      <div ref={captureRef} className="rounded-xl bg-slate-950/35 p-2">
        <SetCards sets={groupSets} start={start} />
      </div>
    </section>
  );
}
