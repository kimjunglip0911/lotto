'use client';

import React from 'react';

interface AnalysisControllerProps {
  onGenerateAndSave: () => void;
  isGenerating: boolean;
  targetDrawNo?: number | null;
}

export function AnalysisController({
  onGenerateAndSave,
  isGenerating,
  targetDrawNo,
}: AnalysisControllerProps) {
  return (
    <div className="bg-card/40 border border-card-border/50 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-white">추천 생성 및 저장 실행</h3>
        <p className="text-sm text-slate-400">
          누적 최저 출현 번호 제외 + 기간별 1등 번호 집합 제외 규칙을 순차 적용합니다.
          {targetDrawNo ? ` (기준 회차: ${targetDrawNo}회)` : ''}
        </p>
      </div>

      <div className="w-full sm:w-auto">
        <button
          type="button"
          onClick={onGenerateAndSave}
          disabled={isGenerating}
          className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-[0_10px_20px_-10px_rgba(59,130,246,0.6)] transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
        >
          {isGenerating ? (
            <span className="material-symbols-outlined animate-spin text-[22px]">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[22px] text-yellow-300">auto_awesome</span>
          )}
          {isGenerating ? '생성 및 저장 처리 중...' : '생성 및 저장 실행'}
        </button>
      </div>
    </div>
  );
}

