'use client';

import React from 'react';
import { getBallColor } from '@/lib/utils/lotteryUtils';

interface AnalysisControllerProps {
  onGenerateAndSave: () => void;
  isGenerating: boolean;
  availableDraws: number[];
  selectedDraw: number | null;
  onDrawChange: (draw: number) => void;
  isLoadingDraws: boolean;
  winningNumbers: number[] | null;
}

export function AnalysisController({
  onGenerateAndSave,
  isGenerating,
  availableDraws,
  selectedDraw,
  onDrawChange,
  isLoadingDraws,
  winningNumbers,
}: AnalysisControllerProps) {
  return (
    <div className="bg-card/40 border border-card-border/50 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
      <div className="flex flex-col gap-3 w-full sm:w-auto">
        <h3 className="text-lg font-semibold text-white">추천 생성 및 저장 실행</h3>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-2 text-sm text-slate-300 min-w-[180px]">
            <span className="font-medium">회차 선택</span>
            <select
              value={selectedDraw ?? ''}
              onChange={(e) => onDrawChange(Number(e.target.value))}
              disabled={isLoadingDraws || availableDraws.length === 0 || isGenerating}
              className="bg-slate-900 border border-white/20 rounded-xl px-4 py-2.5 text-white font-semibold focus:border-primary outline-none transition-all cursor-pointer shadow-inner"
            >
              {isLoadingDraws && <option value="">회차 정보를 불러오는 중...</option>}
              {!isLoadingDraws && availableDraws.length === 0 && <option value="">조회 가능한 회차 없음</option>}
              {availableDraws.map((drawNo) => (
                <option key={drawNo} value={drawNo}>
                  {drawNo}회
                </option>
              ))}
            </select>
          </label>
          {winningNumbers && winningNumbers.length > 0 && (
            <div className="flex flex-col gap-1 pb-0.5">
              <span className="text-xs text-slate-400 font-medium">당첨번호</span>
              <div className="flex items-center gap-1.5">
                {winningNumbers.map((num) => (
                  <div
                    key={num}
                    className={`size-8 flex items-center justify-center rounded-full ${getBallColor(num)} border border-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)]`}
                  >
                    <span className="text-white font-bold text-[11px]">{num < 10 ? `0${num}` : num}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <p className="text-sm text-slate-400">
          누적 최저 출현 번호 제외 + 기간별 1등 번호 집합 제외 규칙을 순차 적용합니다.
        </p>
      </div>

      <div className="w-full sm:w-auto">
        <button
          type="button"
          onClick={onGenerateAndSave}
          disabled={isGenerating || !selectedDraw || isLoadingDraws}
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
