import React from 'react';
import { LotteryCard } from '@/features/home/components/LotteryCard';

interface DrawGridProps {
    sets: any[];
}

export function DrawGrid({ sets }: DrawGridProps) {
    if (!sets || sets.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 xl:gap-8 mt-12 mb-8">
            {sets.map((setInfo, index) => {
                const numbers = [
                    setInfo.num1,
                    setInfo.num2,
                    setInfo.num3,
                    setInfo.num4,
                    setInfo.num5,
                    setInfo.num6
                ];
                return (
                    <LotteryCard
                        key={index}
                        setIndex={index}
                        numbers={numbers}
                    />
                );
            })}
        </div>
    );
}
