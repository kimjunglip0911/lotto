'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { AnalysisResultList } from '@features/analysis/components/AnalysisResultList';

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

export default function CdmAnalysisPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [availableDraws, setAvailableDraws] = useState<number[]>([]);
    const [selectedDraw, setSelectedDraw] = useState<number | 'new'>('new');

    const [generatedSets, setGeneratedSets] = useState<LotterySet[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 초기 마운트 시 회차 목록 불러오기
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const drawsRes = await fetch(`${baseUrl}/api/drawings/draw-numbers`);
                if (!drawsRes.ok) throw new Error('회차 목록을 불러오는데 실패했습니다.');
                const draws: number[] = await drawsRes.json();
                setAvailableDraws(draws.slice(0, 50));
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleGenerateCdm = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const targetDraw = selectedDraw === 'new'
                ? (availableDraws.length > 0 ? availableDraws[0] + 1 : 1)
                : selectedDraw;

            const response = await fetch(`${baseUrl}/api/analysis/cdm/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ draw_no: targetDraw })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'CDM 번호 생성에 실패했습니다.');
            }

            const newData = await response.json();
            setGeneratedSets(newData);

            if (selectedDraw === 'new') {
                setAvailableDraws(prev => [targetDraw as number, ...prev]);
                setSelectedDraw(targetDraw as number);
            }
        } catch (err: any) {
            setError(err.message);
            alert(`오류: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
            <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <main className="flex-1 overflow-y-auto pb-12 px-4 pt-6 space-y-6">
                    <div className="flex flex-col gap-2 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <span className="material-symbols-outlined text-blue-400 text-3xl">analytics</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">CDM 베이지안 분석 모델</h2>
                        </div>
                        <p className="text-slate-400 text-sm ml-12">디리클레-다항 분포를 활용하여 각 번호의 사후 확률 기댓값을 도출하고 최적의 조합을 추천합니다.</p>
                    </div>

                    {/* CDM 전용 컨트롤러 영역 */}
                    <div className="bg-card/40 border border-card-border/50 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col gap-2 w-full sm:w-2/5 md:w-1/3">
                            <label className="text-sm font-bold text-slate-300 ml-1">기준 회차 선택</label>
                            <select
                                value={selectedDraw}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedDraw(val === 'new' ? 'new' : Number(val));
                                }}
                                className="bg-black/60 border border-card-border/80 text-white text-base rounded-xl focus:ring-primary focus:border-primary block w-full p-3 appearance-none cursor-pointer outline-none shadow-inner"
                            >
                                <option value="new">✨ 신규 회차 추첨 (최신)</option>
                                {availableDraws.map((d) => (
                                    <option key={d} value={d}>🕒 {d}회차 기준 분석</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end w-full sm:w-auto">
                            <button
                                onClick={handleGenerateCdm}
                                disabled={isGenerating}
                                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                            >
                                {isGenerating ? (
                                    <span className="material-symbols-outlined animate-spin text-[22px]">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined text-[22px] text-yellow-300">auto_awesome</span>
                                )}
                                {isGenerating ? 'CDM 분석 중...' : 'CDM 추천 번호 생성 (2세트)'}
                            </button>
                        </div>
                    </div>

                    {/* 에러 */}
                    {error && (
                        <div className="text-red-400 py-4 text-center border border-red-900/50 rounded-lg bg-red-950/20 mt-4">
                            분석 중 오류가 발생했습니다: {error}
                        </div>
                    )}

                    {/* 결과 리스트 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 font-medium ml-1">
                            <span className="material-symbols-outlined text-emerald-400">task_alt</span>
                            분석 결과 (가장 확률이 높은 2세트)
                        </div>
                        <AnalysisResultList sets={generatedSets} loading={loading} error={error} />
                    </div>
                </main>
            </div>
        </div>
    );
}
