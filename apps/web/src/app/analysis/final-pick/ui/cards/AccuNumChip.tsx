const chipBase =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-bold';
const chipRose = 'bg-rose-400/20 text-rose-100';
const chipHit =
  'bg-amber-400 text-slate-900 ring-1 ring-amber-200/90 shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)]';

type Props = { n: number | null; mainWinningSet?: Set<number> };

/** 누적 제외 카드용 번호 칩. */
export function AccuNumChip({ n, mainWinningSet }: Props) {
  if (n === null) {
    return (
      <span className={`${chipBase} border border-dashed border-rose-300/30 bg-slate-900/40 text-rose-200/50`}>
        —
      </span>
    );
  }
  const hit = mainWinningSet?.has(n) ?? false;
  return <span className={hit ? `${chipBase} ${chipHit}` : `${chipBase} ${chipRose}`}>{n}</span>;
}
