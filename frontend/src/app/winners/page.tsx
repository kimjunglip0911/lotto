'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { BottomNav } from '@/components/common/BottomNav';

interface LottoWinner {
    draw_no: number;
    num1: number;
    num2: number;
    num3: number;
    num4: number;
    num5: number;
    num6: number;
    bonus_num: number;
    winner_count?: number;
    winner_amount?: number;
}

export default function WinnersPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [winners, setWinners] = useState<LottoWinner[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchWinners() {
            try {
                const response = await fetch('http://localhost:8000/api/winners');
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.ok ? await response.json() : [];
                setWinners(data);
            } catch (error) {
                console.error('Error fetching winners:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchWinners();
    }, []);

    const getBallColor = (num: number) => {
        if (num <= 10) return 'bg-[#fbc400] shadow-[0_0_10px_rgba(251,196,0,0.4)]';
        if (num <= 20) return 'bg-[#69c8f2] shadow-[0_0_10px_rgba(105,200,242,0.4)]';
        if (num <= 30) return 'bg-[#ff7272] shadow-[0_0_10px_rgba(255,114,114,0.4)]';
        if (num <= 40) return 'bg-[#aaaaaa] shadow-[0_0_10px_rgba(170,170,170,0.4)]';
        return 'bg-[#b0d840] shadow-[0_0_10px_rgba(176,216,64,0.4)]';
    };

    return (
        <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
            <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <main className="flex-1 overflow-y-auto pb-24 px-4 pt-6 space-y-6">
                    <div className="flex flex-col gap-2 mb-8">
                        <h2 className="text-3xl font-bold text-white tracking-tight">역대 당첨 리스트</h2>
                        <p className="text-slate-400 text-sm">전체 회차의 당첨 번호와 통계를 최신순으로 확인하세요.</p>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="bg-card-bg/40 border border-card-border/20 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/5 border-b border-card-border/40">
                                            <th className="p-5 text-slate-400 font-semibold text-sm uppercase tracking-wider">회차</th>
                                            <th className="p-5 text-slate-400 font-semibold text-sm uppercase tracking-wider">당첨 번호</th>
                                            <th className="p-5 text-slate-400 font-semibold text-sm uppercase tracking-wider text-center">보너스</th>
                                            <th className="p-5 text-slate-400 font-semibold text-sm uppercase tracking-wider text-right">당첨자(명)</th>
                                            <th className="p-5 text-slate-400 font-semibold text-sm uppercase tracking-wider text-right">1등 당첨금(원)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-card-border/20">
                                        {winners.map((winner) => (
                                            <tr key={winner.draw_no} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-5">
                                                    <span className="text-white font-bold text-lg group-hover:text-primary transition-colors">
                                                        {winner.draw_no}회
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex gap-2">
                                                        {[winner.num1, winner.num2, winner.num3, winner.num4, winner.num5, winner.num6].map((num, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${getBallColor(num)}`}
                                                            >
                                                                {num}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex justify-center">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${getBallColor(winner.bonus_num)}`}>
                                                            {winner.bonus_num}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right font-medium text-slate-300">
                                                    {winner.winner_count?.toLocaleString() || '-'}
                                                </td>
                                                <td className="p-5 text-right font-bold text-primary">
                                                    {winner.winner_amount?.toLocaleString() || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>

                <BottomNav />
            </div>
        </div>
    );
}
