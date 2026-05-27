'use client';

import { getBallColor } from '@/lib/utils/lotteryUtils';

/** 당첨번호 6개 공 표시 */

export const WinningNumbersView = ({ winningNumbers }: { winningNumbers: number[] | null }) => {
  if (!winningNumbers || winningNumbers.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 pb-0.5">
      <span className="text-xs text-slate-400 font-medium">당첨번호</span>
      <div className="flex items-center gap-1.5">
        {winningNumbers.map((num) => (
          <div
            key={num}
            className={`size-8 flex items-center justify-center rounded-full ${getBallColor(num)} border border-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)]`}
          >
            <span className="text-white font-bold text-[11px]">{num < 10 ? `0${num}` : num}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
