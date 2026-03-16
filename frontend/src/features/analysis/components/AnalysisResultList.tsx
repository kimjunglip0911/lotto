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

    const optimalSets = sets.filter(s => s.method === "통합 최적 조합");
    const bestSets = sets.filter(s => s.method !== "통합 최적 조합");

    // 기법-통합 교차 배열 (bestSets[0], optimalSets[0], bestSets[1], optimalSets[1], ...)
    const mergedSets: LotterySet[] = [];
    const len = Math.min(bestSets.length, optimalSets.length);
    for (let i = 0; i < len; i++) {
        mergedSets.push(bestSets[i]);
        mergedSets.push(optimalSets[i]);
    }
    // 한쪽만 있을 경우 나머지 추가
    const remaining = len < bestSets.length ? bestSets.slice(len) : optimalSets.slice(len);
    mergedSets.push(...remaining);

    return (
        <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">👑</span>
                <h3 className="text-xl font-bold text-white tracking-wide">
                    통합 20세트 — 기법·통합 최적 조합
                </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {mergedSets.map((set, index) => (
                    <LotteryCard
                        key={`merged-${index}`}
                        setIndex={index}
                        drawNo={set.draw_no || 0}
                        numbers={[set.num1, set.num2, set.num3, set.num4, set.num5, set.num6]}
                        method={set.method}
                    />
                ))}
            </div>
        </div>
    );
};
