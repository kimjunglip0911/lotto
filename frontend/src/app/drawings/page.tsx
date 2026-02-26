'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { BottomNav } from '@/components/common/BottomNav';

interface PooledDrawing {
    id: number;
    num1: number;
    num2: number;
    num3: number;
    num4: number;
    num5: number;
    num6: number;
    bonus_num: number;
}

export default function DrawingsPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [drawings, setDrawings] = useState<PooledDrawing[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchDrawings() {
            try {
                const response = await fetch('http://localhost:8000/api/drawings');
                if (!response.ok) throw new Error('Failed to fetch drawings');
                const data = await response.json();
                setDrawings(data);
            } catch (error) {
                console.error('Error fetching drawings:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDrawings();
    }, []);

    const getBallColor = (num: number) => {
        if (num <= 10) return 'bg-[#fbc400] shadow-[0_0_8px_rgba(251,196,0,0.3)]';
        if (num <= 20) return 'bg-[#69c8f2] shadow-[0_0_8px_rgba(105,200,242,0.3)]';
        if (num <= 30) return 'bg-[#ff7272] shadow-[0_0_8px_rgba(255,114,114,0.3)]';
        if (num <= 40) return 'bg-[#aaaaaa] shadow-[0_0_8px_rgba(170,170,170,0.3)]';
        return 'bg-[#b0d840] shadow-[0_0_8px_rgba(176,216,64,0.3)]';
    };

    return (
        <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
            <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <main className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white tracking-tight italic">분석 기반 추첨 풀</h2>
                        <p className="text-slate-400 text-sm mt-2">분석 페이지에서 생성된 최적의 100세트 번호 리스트입니다. <br />홈 화면 추천 시 이 목록에서 랜덤으로 선정됩니다.</p>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
                        </div>
                    ) : drawings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 bg-card-bg/20 rounded-3xl border border-dashed border-card-border/40">
                            <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">search_off</span>
                            <p className="text-slate-500">생성된 번호 세트가 없습니다.</p>
                            <p className="text-slate-500 text-sm">분석 페이지에서 '100세트 생성'을 먼저 진행해 주세요.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {drawings.map((draw, idx) => (
                                <div key={draw.id} className="bg-card-bg/40 border border-card-border/20 rounded-2xl p-4 backdrop-blur-sm hover:border-primary/40 transition-all group">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-slate-500 text-xs font-mono">SET #{drawings.length - idx}</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {[draw.num1, draw.num2, draw.num3, draw.num4, draw.num5, draw.num6].map((num, nIdx) => (
                                            <div key={nIdx} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${getBallColor(num)}`}>
                                                {num}
                                            </div>
                                        ))}
                                        <div className="flex items-center px-1 text-slate-600 font-bold">+</div>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${getBallColor(draw.bonus_num)}`}>
                                            {draw.bonus_num}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                <BottomNav />
            </div>
        </div>
    );
}
