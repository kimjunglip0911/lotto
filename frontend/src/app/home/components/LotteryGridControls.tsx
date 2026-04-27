import React from 'react';
import { Save, Loader2, Check } from 'lucide-react';
import { isValidLottoNumber, type InputNumber, type SaveStatus } from '@/app/home/components/types';

interface LotteryGridControlsProps {
  selectedDraw: number | null;
  availableDraws: number[];
  winningNumbers: InputNumber[];
  winningBonus: InputNumber;
  onSelectDraw: (value: number | null) => void;
  onWinningNumberChange: (index: number, value: string) => void;
  onBonusNumberChange: (value: string) => void;
  onSaveWinning: () => void;
  isSaving: boolean;
  saveStatus: SaveStatus;
}

export function LotteryGridControls({
  selectedDraw,
  availableDraws,
  winningNumbers,
  winningBonus,
  onSelectDraw,
  onWinningNumberChange,
  onBonusNumberChange,
  onSaveWinning,
  isSaving,
  saveStatus,
}: LotteryGridControlsProps) {
  const canSave = !isSaving && winningNumbers.every(isValidLottoNumber) && isValidLottoNumber(winningBonus);

  return (
    <div className="flex flex-col xl:flex-row xl:justify-between items-center gap-4 xl:gap-8 mb-8 z-10 w-full bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10 backdrop-blur-md">
      <div className="flex items-center gap-3 w-full xl:w-auto justify-center xl:justify-start">
        <span className="text-white/60 font-medium whitespace-nowrap">회차 검색</span>
        <select
          value={selectedDraw ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            onSelectDraw(value === '' ? null : Number.parseInt(value, 10));
          }}
          className="bg-slate-900 border border-white/20 rounded-xl px-4 py-2.5 text-white font-bold focus:border-primary outline-none transition-all cursor-pointer min-w-[120px] shadow-inner"
        >
          {availableDraws.length === 0 && <option value="">데이터 없음</option>}
          {availableDraws.map((drawNo) => (
            <option key={drawNo} value={drawNo}>
              {drawNo}회
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 w-full xl:w-auto">
        <div className="flex gap-1.5 sm:gap-2">
          {winningNumbers.map((num, index) => (
            <input
              key={index}
              type="number"
              min="1"
              max="45"
              value={num}
              onChange={(e) => onWinningNumberChange(index, e.target.value)}
              className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-900/80 border border-white/20 rounded-full text-center text-white font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-white/40 font-bold ml-1 mr-1">+</span>
          <input
            type="number"
            min="1"
            max="45"
            value={winningBonus}
            onChange={(e) => onBonusNumberChange(e.target.value)}
            className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-900/80 border border-emerald-500/50 rounded-full text-center text-emerald-400 font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <button
          type="button"
          disabled={!canSave}
          onClick={onSaveWinning}
          className={`ml-1 flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
            saveStatus === 'success'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : canSave
                ? 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:border-primary/60 cursor-pointer'
                : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveStatus === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? '저장 중...' : saveStatus === 'success' ? '저장 완료' : '저장'}
        </button>
      </div>
    </div>
  );
}

