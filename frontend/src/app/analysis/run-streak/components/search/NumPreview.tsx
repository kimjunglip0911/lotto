import { getMainNumbers } from '../../logic/consec';
import type { WinningNumberRow } from '../../types';

// 조회한 회차의 당첨번호(본번호 6 + 보너스 1)를 미리 보여 줍니다. 불러오는 동안은 안내 문구만 보입니다.

type NumPreviewProps = {
  isLoadingWinningNumber: boolean;
  selectedWinningNumber: WinningNumberRow | null;
};

export const NumPreview = ({
  isLoadingWinningNumber,
  selectedWinningNumber,
}: NumPreviewProps) => {
  const mainNumbers = selectedWinningNumber ? getMainNumbers(selectedWinningNumber) : [];
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 min-h-[74px] lg:min-w-[440px]">
      <p className="text-xs font-medium text-slate-300 mb-2">선택 회차 당첨번호 (보너스 포함)</p>
      {isLoadingWinningNumber ? (
        <p className="text-sm text-slate-300">당첨번호를 불러오는 중입니다...</p>
      ) : selectedWinningNumber ? (
        <div className="flex flex-wrap items-center gap-2">
          {mainNumbers.map((num, index) => (
            <span
              key={`${selectedWinningNumber.draw_no}-main-${index}`}
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-primary/25 px-2 text-sm font-semibold text-primary"
            >
              {num}
            </span>
          ))}
          <span className="text-sm text-slate-400 px-1">+</span>
          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-amber-400/25 px-2 text-sm font-semibold text-amber-300">
            {selectedWinningNumber.bonus_num}
          </span>
          <span className="text-xs text-amber-300 font-medium">보너스</span>
        </div>
      ) : (
        <p className="text-sm text-slate-300">회차를 선택한 뒤 조회 버튼을 누르면 당첨번호가 표시됩니다.</p>
      )}
    </div>
  );
};
