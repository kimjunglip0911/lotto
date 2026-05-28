/**
 * 홈 화면에서 사용자가 당첨번호 6개와 보너스 번호 1개를 입력하는 UI입니다.
 * 숫자 입력 공통 스타일과 범위(1~45)를 한곳에서 관리해 입력 규칙이 흩어지지 않게 유지합니다.
 * 각 입력값 변경은 부모에서 전달한 콜백으로만 전달하며, 이 파일은 입력 표시와 이벤트 전달만 담당합니다.
 * 입력값이 비어 있거나 잘못된 값이면 이후 저장/계산 흐름에서 실패 상태가 표시될 수 있으므로
 * 이 파일은 값 가공 없이 사용자가 입력한 문자열을 그대로 상위 로직으로 전달합니다.
 */

import type { InputNumber } from '../../types/home';

interface WinInputsProps {
  winningNumbers: InputNumber[];
  winningBonus: InputNumber;
  onWinNumChg: (index: number, value: string) => void;
  onBonusChg: (value: string) => void;
}

interface NumInputProps {
  value: InputNumber;
  onChg: (value: string) => void;
  extraClass: string;
}

const baseInputClass =
  'w-10 h-10 sm:w-11 sm:h-11 bg-slate-900/80 border rounded-full text-center font-bold outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

function NumInput({ value, onChg, extraClass }: NumInputProps) {
  return (
    <input
      type="number"
      min="1"
      max="45"
      value={value}
      onChange={(e) => onChg(e.target.value)}
      className={`${baseInputClass} ${extraClass}`}
    />
  );
}

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
          <NumInput
            key={index}
            value={num}
            onChg={(value) => onWinNumChg(index, value)}
            extraClass="border-white/20 text-white focus:border-primary focus:ring-1 focus:ring-primary"
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="text-white/40 font-bold ml-1 mr-1">+</span>
        <NumInput
          value={winningBonus}
          onChg={onBonusChg}
          extraClass="border-emerald-500/50 text-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        />
      </div>
    </>
  );
}
