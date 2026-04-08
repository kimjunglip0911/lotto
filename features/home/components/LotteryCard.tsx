import React from 'react';
import { LotteryBall } from '@/components/ui/LotteryBall';

export interface LotteryCardProps {
  setIndex: number;
  drawNo: number;
  numbers: number[];
  method?: string;
}

export function LotteryCard({ setIndex, drawNo, numbers, method }: LotteryCardProps) {
  return (
    <div className="bg-background/20 backdrop-blur-sm border border-card-border/60 rounded-3xl p-6 py-7 flex flex-col items-center justify-center gap-5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] transition-all hover:bg-background/40 hover:border-primary/30 w-full overflow-hidden relative group">
      <div className="flex justify-between w-full items-center mb-1 px-1">
        <span className="text-[16px] font-black text-primary uppercase tracking-wider">SET {setIndex + 1}</span>
        <span className="text-[14px] font-semibold text-slate-300 bg-slate-800/50 px-2.5 py-1 rounded-md">({drawNo}회차)</span>
      </div>

      <div className="flex items-center justify-center gap-1.5 flex-nowrap shrink-0 w-full my-2 scale-[0.98] group-hover:scale-100 transition-transform duration-300">
        <div className="flex gap-1.5">
          {numbers.map((num, index) => (
            <LotteryBall key={index} num={num} />
          ))}
        </div>
      </div>

      <div className="mt-1 text-[13px] font-medium text-slate-300 bg-black/20 border border-white/10 px-3 py-2 rounded-lg w-full text-center truncate">
        분석 기법 : <span className="text-white ml-1">{method || '기본'}</span>
      </div>
    </div>
  );
}
