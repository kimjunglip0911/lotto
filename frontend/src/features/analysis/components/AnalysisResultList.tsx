'use client';

import React from 'react';
import { LotteryCard } from '@/features/home/components/LotteryCard';

interface LotterySet {
    id?: number;
    draw_no?: number;
    method?: string;
    num1: number;
    num2: number;
    num3: number;
    num4: number;
    num5: number;
    num6: number;
}

interface AnalysisResultListProps {
    sets: LotterySet[];
    loading?: boolean;
    error?: string | null;
}

export const AnalysisResultList: React.FC<AnalysisResultListProps> = ({ sets, loading, error }) => {
    if (loading) {
        return (
            <div className="text-slate-400 py-12 text-center animate-pulse flex flex-col items-center gap-4">
                <span className="material-symbols-outlined animate-spin text-4xl text-emerald-500">progress_activity</span>
                <p>저장된 추천 번호를 불러오는 중입니다...</p>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-400 py-4 mt-8 text-center border border-red-900/50 rounded-lg bg-red-950/20">오류가 발생했습니다: {error}</div>;
    }

    if (!sets || sets.length === 0) return null;

    return (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sets.map((set, index) => (
                    <LotteryCard
                        key={`result-${index}`}
                        setIndex={index}
                        drawNo={set.draw_no || 0} // 생성된 번호 
                        numbers={[set.num1, set.num2, set.num3, set.num4, set.num5, set.num6]}
                        method={set.method}
                    />
                ))}
            </div>
        </div>
    );
};
