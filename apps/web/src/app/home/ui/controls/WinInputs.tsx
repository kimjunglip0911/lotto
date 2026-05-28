/** 당첨번호 6개·보너스 번호 입력 필드 */

import type { InputNumber } from '../../types/home';

interface WinInputsProps {
  winningNumbers: InputNumber[];
  winningBonus: InputNumber;
  onWinNumChg: (index: number, value: string) => void;
  onBonusChg: (value: string) => void;
}

const inputClass =
  'w-10 h-10 sm:w-11 sm:h-11 bg-slate-900/80 border rounded-full text-center font-bold outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

export function WinInputs({
  winningNumbers,
  winningBonus,
  onWinNumChg,
  onBonusChg,
}: WinInputsProps) {
  return (
    <>
      <div className="flex gap-1.5 sm:gap-2">
        {winningNumbers.map((num, index) => (
          <input
            key={index}
            type="number"
            min="1"
            max="45"
            value={num}
            onChange={(e) => onWinNumChg(index, e.target.value)}
            className={`${inputClass} border-white/20 text-white focus:border-primary focus:ring-1 focus:ring-primary`}
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
          onChange={(e) => onBonusChg(e.target.value)}
          className={`${inputClass} border-emerald-500/50 text-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500`}
        />
      </div>
    </>
  );
}
