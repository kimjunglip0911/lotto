/** 본당첨이면 노란 원, 아니면 제외(rose)·전략(primary) 칩으로 번호 한 개를 보여 줍니다. */

const hitCls =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-slate-900 shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] ring-1 ring-amber-200/90';

export const AccNumHit = ({
  n,
  isHit,
  variant,
}: {
  n: number;
  isHit: boolean;
  variant: 'excl' | 'strat';
}) => {
  if (isHit) {
    return <span className={hitCls}>{n}</span>;
  }
  const pill =
    variant === 'excl'
      ? 'px-2 py-1 rounded-md text-xs font-semibold bg-rose-400/25 text-rose-100'
      : 'px-2 py-1 rounded-md text-xs font-semibold bg-primary/20 text-primary';
  return <span className={pill}>{n}</span>;
};
