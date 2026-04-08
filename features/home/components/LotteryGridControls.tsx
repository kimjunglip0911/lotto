import React from 'react';

interface LotteryGridControlsProps {
  selectedDraw: number | string;
  availableDraws: number[];
  winningNumbers: (number | '')[];
  winningBonus: number | '';
  onSelectDraw: (value: string) => void;
  onWinningNumberChange: (index: number, value: string) => void;
  onBonusNumberChange: (value: string) => void;
}

export function LotteryGridControls({
  selectedDraw,
  availableDraws,
  winningNumbers,
  winningBonus,
  onSelectDraw,
  onWinningNumberChange,
  onBonusNumberChange,
}: LotteryGridControlsProps) {
  return (
    <div className="flex flex-col xl:flex-row xl:justify-between items-center gap-4 xl:gap-8 mb-8 z-10 w-full bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10 backdrop-blur-md">
      <div className="flex items-center gap-3 w-full xl:w-auto justify-center xl:justify-start">
        <span className="text-white/60 font-medium whitespace-nowrap">회차 검색</span>
        <select
          value={selectedDraw}
          onChange={(e) => onSelectDraw(e.target.value)}
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
      </div>
    </div>
  );
}
