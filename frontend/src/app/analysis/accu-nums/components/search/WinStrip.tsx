import type { WinningNumberRow } from '../../types';

export type SelectedWinningNumbersStripProps = {
  isLoadingSelectedWinningNumber: boolean;
  selectedWinningNumberError: string | null;
  selectedWinningNumber: WinningNumberRow | null;
  selectedMainNumbers: number[];
};

/**
 * “기준으로 삼은 회차”의 당첨 번호를 한 줄로 보여 줍니다.
 *
 * - 본번호 6개와 보너스 1개는 **표시** 목적입니다. (누적·전략 차트에서 번호별로 셀 때는 보너스까지 포함합니다.)
 * - 과거 회차를 거슬러 “그때 고른 4개가 몇 개 맞았나”를 계산할 때는 **본번호 6개만** 비교합니다(로직 문서와 동일).
 */
export function SelectedWinningNumbersStrip({
  isLoadingSelectedWinningNumber,
  selectedWinningNumberError,
  selectedWinningNumber,
  selectedMainNumbers,
}: SelectedWinningNumbersStripProps) {
  if (isLoadingSelectedWinningNumber) {
    return <p className="text-sm text-slate-300">당첨번호를 불러오는 중입니다...</p>;
  }

  if (selectedWinningNumberError) {
    return <p className="text-sm text-rose-300">{selectedWinningNumberError}</p>;
  }

  if (!selectedWinningNumber) {
    return <p className="text-sm text-slate-300">회차를 선택한 뒤 조회 버튼을 누르면 당첨번호가 표시됩니다.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selectedMainNumbers.map((num, index) => (
        <span
          key={`${selectedWinningNumber.draw_no}-${index}-${num}`}
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
  );
}
