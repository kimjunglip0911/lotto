import { AccuNumChip } from './AccuNumChip';

type Props = {
  label: string;
  highest: number | null;
  lowest: number | null;
  mainWinningSet?: Set<number>;
};

/** 누적 제외 카드 — 2년 또는 전체 열. */
export function AccuExclCol({ label, highest, lowest, mainWinningSet }: Props) {
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-slate-900/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 w-10 shrink-0">최다</span>
        <AccuNumChip n={highest} mainWinningSet={mainWinningSet} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 w-10 shrink-0">최소</span>
        <AccuNumChip n={lowest} mainWinningSet={mainWinningSet} />
      </div>
    </div>
  );
}
