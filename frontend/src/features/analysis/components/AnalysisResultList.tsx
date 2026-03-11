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

    return (
        <div className="mt-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {optimalSets.length > 0 && (
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-3xl">👑</span>
                        <h3 className="text-2xl font-bold text-white tracking-wide">
                            통합 최적 조합 <span className="text-emerald-400">Top 10</span>
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {optimalSets.map((set, index) => (
                            <LotteryCard
                                key={`optimal-${index}`}
                                setIndex={index}
                                drawNo={set.draw_no || 0}
                                numbers={[set.num1, set.num2, set.num3, set.num4, set.num5, set.num6]}
                                method={set.method}
                            />
                        ))}
                    </div>
                </div>
            )}

            {bestSets.length > 0 && (
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-2xl">⚡</span>
                        <h3 className="text-xl font-semibold text-slate-200 tracking-wide">
                            10가지 분석 기법별 추천 픽
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {bestSets.map((set, index) => (
                            <LotteryCard
                                key={`best-${index}`}
                                setIndex={index}
                                drawNo={set.draw_no || 0}
                                numbers={[set.num1, set.num2, set.num3, set.num4, set.num5, set.num6]}
                                method={set.method}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
