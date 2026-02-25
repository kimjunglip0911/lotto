import React from 'react';
import { getBallColor } from '@/lib/utils/lotteryUtils';

export interface LotteryBallProps {
    num: number;
    isBonus?: boolean;
}

export function LotteryBall({ num, isBonus = false }: LotteryBallProps) {
    const colorClass = getBallColor(num);
    const displayNum = num < 10 ? `0${num}` : num.toString();

    if (isBonus) {
        return (
            <div className={`size-7 sm:size-8 flex items-center justify-center rounded-full ${colorClass} border border-white/20 shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-transform hover:scale-110`}>
                <span className="text-white font-bold text-[10px] sm:text-xs">{displayNum}</span>
            </div>
        );
    }

    return (
        <div className={`size-7 sm:size-8 flex items-center justify-center rounded-full ${colorClass} border border-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-transform hover:scale-110`}>
            <span className="text-white font-bold text-[10px] sm:text-xs">{displayNum}</span>
        </div>
    );
}
