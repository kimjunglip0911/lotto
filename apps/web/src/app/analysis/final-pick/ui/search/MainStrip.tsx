import type { WinningNumberRow } from '../../types/winRow';

type Props = {
  isLoadingWinningNumber: boolean;
  winningNumberError: string | null;
  selectedWinningNumber: WinningNumberRow | null;
  selectedMainNumbers: number[];
};

/** 선택 회차 본번호 6개 칩(보너스 미표시). */
export function MainStrip({
  isLoadingWinningNumber,
  winningNumberError,
  selectedWinningNumber,
  selectedMainNumbers,
}: Props) {
  if (isLoadingWinningNumber) {
    return <p className="text-sm text-slate-300">당첨번호를 불러오는 중입니다...</p>;
  }
  if (winningNumberError) return <p className="text-sm text-rose-300">{winningNumberError}</p>;
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
    </div>
  );
}
