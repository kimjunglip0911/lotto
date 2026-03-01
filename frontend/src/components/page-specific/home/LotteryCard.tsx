import React from 'react';
import { LotteryBall } from '@/components/ui/LotteryBall';

export interface LotteryCardProps {
    setIndex: number;
    numbers: number[];
}

export function LotteryCard({ setIndex, numbers }: LotteryCardProps) {
    return (
        <div className="bg-background/20 backdrop-blur-sm border border-card-border/60 rounded-3xl p-6 py-10 flex flex-col items-center justify-center gap-5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] transition-all hover:bg-background/40 hover:border-primary/30 w-full overflow-hidden">
            <div className="text-[15px] font-bold text-slate-400 uppercase tracking-widest mb-1">SET {setIndex + 1}</div>

            {/* 6 Balls */}
            <div className="flex items-center justify-center gap-1.5 flex-nowrap shrink-0">
                <div className="flex gap-1.5">
                    {numbers.map((num, i) => (
                        <LotteryBall key={i} num={num} />
                    ))}
                </div>
            </div>
        </div>
    );
}
