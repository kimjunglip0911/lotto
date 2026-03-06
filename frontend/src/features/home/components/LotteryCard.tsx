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
        <div className="bg-background/20 backdrop-blur-sm border border-card-border/60 rounded-3xl p-5 py-6 flex flex-col items-center justify-center gap-4 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] transition-all hover:bg-background/40 hover:border-primary/30 w-full overflow-hidden relative group">
            {/* Header Area */}
            <div className="flex justify-between w-full items-center mb-1 px-1">
                <span className="text-[14px] font-black text-primary uppercase tracking-wider">SET {setIndex + 1}</span>
                <span className="text-[13px] font-medium text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-md">({drawNo}회차)</span>
            </div>

            {/* 6 Balls */}
            <div className="flex items-center justify-center gap-1.5 flex-nowrap shrink-0 w-full my-2 scale-[0.95] group-hover:scale-100 transition-transform duration-300">
                <div className="flex gap-1.5">
                    {numbers.map((num, i) => (
                        <LotteryBall key={i} num={num} />
                    ))}
                </div>
            </div>

            {/* Method Area */}
            <div className="mt-1 text-[12px] font-medium text-slate-500 bg-black/20 border border-white/5 px-3 py-1.5 rounded-lg w-full text-center truncate">
                분석 기법 : <span className="text-slate-300 ml-1">{method || '기본'}</span>
            </div>
        </div>
    );
}
