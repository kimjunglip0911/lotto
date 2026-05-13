import type { WinningNumberRow } from '../../types';
import { SelectedWinningNumbersStrip } from './WinStrip';

/** 선택 회차 당첨번호 미리보기 박스입니다. */

type Props = {
  isLoadingSelectedWinningNumber: boolean;
  selectedWinningNumberError: string | null;
  selectedWinningNumber: WinningNumberRow | null;
  selectedMainNumbers: number[];
};

export const SearchWinPreview = ({
  isLoadingSelectedWinningNumber,
  selectedWinningNumberError,
  selectedWinningNumber,
  selectedMainNumbers,
}: Props) => (
  <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 min-h-[74px] lg:min-w-[440px]">
    <p className="text-xs font-medium text-slate-300 mb-2">선택 회차 당첨번호 (보너스 포함)</p>
    <SelectedWinningNumbersStrip
      isLoadingSelectedWinningNumber={isLoadingSelectedWinningNumber}
      selectedWinningNumberError={selectedWinningNumberError}
      selectedWinningNumber={selectedWinningNumber}
      selectedMainNumbers={selectedMainNumbers}
    />
  </div>
);
