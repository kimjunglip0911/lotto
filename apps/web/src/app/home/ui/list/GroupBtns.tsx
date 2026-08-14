'use client';

import { GROUP_COUNT, GROUP_SIZE } from '../../constants/home';
import { grpLabel } from '../../logic/grpLabel';

type Props = {
  sel: number;
  onSel: (index: number) => void;
};

const btnCls = (active: boolean) =>
  active
    ? 'rounded-md border border-primary/40 bg-primary/25 px-3 py-1.5 text-xs font-semibold text-primary'
    : 'rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10';

export function GroupBtns({ sel, onSel }: Props) {
  return (
    <div className="mb-4 flex flex-wrap gap-2 ml-1">
      {Array.from({ length: GROUP_COUNT }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-pressed={sel === i}
          onClick={() => onSel(i)}
          className={btnCls(sel === i)}
        >
          {grpLabel(i, GROUP_SIZE)}
        </button>
      ))}
    </div>
  );
}
