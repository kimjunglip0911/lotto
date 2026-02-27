'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';

export default function DrawingsPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [drawings, setDrawings] = useState<any[]>([]);
    const [drawNumbers, setDrawNumbers] = useState<number[]>([]);
    const [selectedDrawNo, setSelectedDrawNo] = useState<string>("new"); // "new" for New Draw
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchDrawNumbers = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/drawings/draw-numbers');
            if (response.ok) {
                const data = await response.json();
                setDrawNumbers(data);

                // 페이지 로드 시에만 "new" 상태 유지 또는 최신 회차가 있다면 선택 (원하는 방향에 따라 조절)
                // 사용자가 "신규회차 선택 이후 ..." 라고 했으므로 기본을 "new"로 두거나 최신을 두거나 상관없지만
                // 직관적으로 신규 추가가 편리하도록 "new"를 기본값으로 유지하겠습니다.
            }
        } catch (error) {
            console.error('Error fetching draw numbers:', error);
        }
    };

    const fetchDrawings = async (drawNo?: string) => {
        setIsLoading(true);
        try {
            // "new"인 경우 목록을 비우거나 전체를 보여줄 수 있는데, 
            // 필터링 관점에서는 "new"일 때는 아직 데이터가 없는 상태이므로 빈 목록을 보여주는게 자연스럽습니다.
            if (drawNo === "new") {
                setDrawings([]);
                setIsLoading(false);
                return;
            }

            const url = drawNo && drawNo !== ""
                ? `http://localhost:8000/api/drawings?draw_no=${drawNo}`
                : 'http://localhost:8000/api/drawings';
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch drawings');
            const data = await response.json();
            setDrawings(data);
        } catch (error) {
            console.error('Error fetching drawings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDrawNumbers();
    }, []);

    useEffect(() => {
        fetchDrawings(selectedDrawNo);
    }, [selectedDrawNo]);

    const handleAiGenerate = async () => {
        // 이미 해당 회차에 데이터가 있는 경우 확인 팝업
        if (selectedDrawNo !== "new" && drawings.length > 0) {
            if (!confirm(`해당 회차(${selectedDrawNo}회)에 이미 추첨 세트가 존재합니다. 추첨 세트를 변경하시겠습니까?`)) {
                return;
            }
        }

        setIsGenerating(true);
        try {
            const url = selectedDrawNo === "new"
                ? 'http://localhost:8000/api/analysis/generate/ai'
                : `http://localhost:8000/api/analysis/generate/ai?draw_no=${selectedDrawNo}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to generate AI drawings');

            // 회차 목록 갱신
            await fetchDrawNumbers();

            // 만약 신규 회차였다면, 생성된 최신 회차를 가져와서 선택해줘야 함 (backend에서 +1 됨)
            // 이를 위해 전체 목록을 다시 가져오고 그 중 첫 번째(최신)를 선택
            const listRes = await fetch('http://localhost:8000/api/drawings/draw-numbers');
            if (listRes.ok) {
                const refreshedNumbers = await listRes.json();
                if (refreshedNumbers.length > 0) {
                    setSelectedDrawNo(refreshedNumbers[0].toString());
                }
            }

            alert('7가지 분석 기법을 활용한 70세트가 생성되었습니다.');
        } catch (error) {
            console.error('Error generating AI drawings:', error);
            alert('번호 생성 중 오류가 발생했습니다.');
        } finally {
            setIsGenerating(false);
        }
    };

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

                <main className="flex-1 overflow-y-auto pb-12 px-4 pt-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-tight italic">분석 기반 추첨 풀</h2>
                            <p className="text-slate-400 text-sm mt-2">분석 페이지 및 AI 엔진에서 생성된 번호 리스트입니다. <br />최신 결과가 상단에 표시됩니다.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleAiGenerate}
                                disabled={isGenerating}
                                className="flex items-center gap-3 px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-[0_4px_20px_rgba(139,92,246,0.3)] transition-all group"
                            >
                                {isGenerating ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <span className="material-symbols-outlined text-xl group-hover:rotate-180 transition-transform duration-500">psychology</span>
                                )}
                                {isGenerating ? 'AI 번호 분석 중...' : 'AI 번호 추첨 실행 (70세트)'}
                            </button>

                            {/* 회차 선택 박스 */}
                            <div className="relative group">
                                <select
                                    value={selectedDrawNo}
                                    onChange={(e) => setSelectedDrawNo(e.target.value)}
                                    className="appearance-none bg-[#0f172a]/80 border border-card-border/40 text-white text-sm font-bold py-3 pl-5 pr-12 rounded-2xl focus:outline-none focus:border-primary/60 transition-all hover:bg-[#1e293b] cursor-pointer shadow-lg"
                                >
                                    <option value="new" className="text-emerald-400 font-black">✨ 신규회차 생성</option>
                                    <option value="" className="text-slate-400">전체 회차 (조회)</option>
                                    {drawNumbers.map(no => (
                                        <option key={no} value={no} className="text-white">{no}회차 (편집/조회)</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover:text-primary transition-colors">
                                    unfold_more
                                </span>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
                        </div>
                    ) : drawings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 bg-card-bg/20 rounded-3xl border border-dashed border-card-border/40">
                            <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">search_off</span>
                            <p className="text-slate-500">{selectedDrawNo === "new" ? "신규 회차 생성을 위해 추첨 버튼을 눌러주세요." : "해당 회차에 생성된 번호 세트가 없습니다."}</p>
                            <p className="text-slate-500 text-sm">{selectedDrawNo === "new" ? "" : "다른 회차를 선택하거나 AI 추첨을 실행해 주세요."}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {drawings.map((draw, idx) => (
                                <div key={draw.id} className="bg-card-bg/40 border border-card-border/20 rounded-2xl p-4 backdrop-blur-sm hover:border-primary/40 transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 text-[10px] font-mono leading-none border-r border-slate-700 pr-2">SET #{drawings.length - idx}</span>
                                                <span className="text-[10px] font-bold text-emerald-400 leading-none">{draw.draw_no ? `${draw.draw_no}회` : '준비중'}</span>
                                            </div>
                                            <span className="text-[11px] font-black text-violet-400 leading-none">
                                                {draw.method || 'Standard Prediction'}
                                            </span>
                                        </div>
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
            </div>
        </div>
    );
}
