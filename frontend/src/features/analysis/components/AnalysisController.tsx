'use client';

import React from 'react';

interface AnalysisControllerProps {
    availableDraws: number[];
    selectedDraw: number | 'new';
    onDrawSelect: (draw: number | 'new') => void;
    onGenerate: () => void;
    onGenerateWheel?: () => void;
    isGenerating: boolean;
    isGeneratingWheel?: boolean;
    isMaxReached: boolean;
    totalSets: number;
}

export function AnalysisController({
    availableDraws,
    selectedDraw,
    onDrawSelect,
    onGenerate,
    onGenerateWheel,
    isGenerating,
    isGeneratingWheel = false,
    isMaxReached,
    totalSets: _totalSets,
}: AnalysisControllerProps) {
    void _totalSets;
    const busy = isGenerating || isGeneratingWheel;
    return (
        <div className="bg-card/40 border border-card-border/50 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            <div className="flex flex-col gap-2 w-full sm:w-2/5 md:w-1/3">
                <label className="text-sm font-bold text-slate-300 ml-1">기준 회차 선택</label>
                <select
                    value={selectedDraw}
                    onChange={(e) => {
                        const val = e.target.value;
                        onDrawSelect(val === 'new' ? 'new' : Number(val));
                    }}
                    className="bg-black/60 border border-card-border/80 text-white text-base rounded-xl focus:ring-primary focus:border-primary block w-full p-3 transition-colors appearance-none cursor-pointer outline-none shadow-inner"
                >
                    <option value="new">✨ 신규 회차 추첨 (최신)</option>
                    {availableDraws.map((d) => (
                        <option key={d} value={d}>🕒 {d}회차 기준 생성/조회</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-end w-full sm:w-auto gap-3">
                {!isMaxReached ? (
                    <button
                        onClick={onGenerate}
                        disabled={busy}
                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-[0_10px_20px_-10px_rgba(59,130,246,0.6)] transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                    >
                        {isGenerating ? (
                            <span className="material-symbols-outlined animate-spin text-[22px]">
                                progress_activity
                            </span>
                        ) : (
                            <span className="material-symbols-outlined text-[22px] text-yellow-300">
                                auto_awesome
                            </span>
                        )}
                        {isGenerating
                            ? '최적 20세트 분석 및 생성 중...'
                            : '통합 20세트 추출하기'}
                    </button>
                ) : null}
                {onGenerateWheel ? (
                    <button
                        type="button"
                        onClick={onGenerateWheel}
                        disabled={busy}
                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-[0_10px_20px_-10px_rgba(168,85,247,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                        title="등속 감속 휠 물리 시뮬레이션. DB에 저장되지 않습니다."
                    >
                        {isGeneratingWheel ? (
                            <span className="material-symbols-outlined animate-spin text-[22px]">
                                progress_activity
                            </span>
                        ) : (
                            <span className="material-symbols-outlined text-[22px] text-amber-200">
                                casino
                            </span>
                        )}
                        {isGeneratingWheel ? '휠 시뮬레이션 생성 중...' : '휠 시뮬레이션 20세트 (미저장)'}
                    </button>
                ) : null}
                {isMaxReached ? (
                    <div className="w-full sm:w-auto px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-inner">
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                        모든 분석 완료 (통합 최적 20세트 도출 성공)
                    </div>
                ) : null}
            </div>
        </div>
    );
}
