import type { WinningNumberRow } from '../types';

type SearchPanelProps = {
  availableDraws: number[];
  selectedDraw: string;
  onSelectedDrawChange: (value: string) => void;
  onSearch: () => void;
  isLoadingDraws: boolean;
  isSearching: boolean;
  isLoadingWinningNumber: boolean;
  winningNumberError: string | null;
  selectedWinningNumber: WinningNumberRow | null;
  selectedMainNumbers: number[];
  searchError: string | null;
};

/**
 * 통합 분석 페이지 상단 패널: 회차 선택 → 조회 → 선택 회차 본번호(6개) 미리보기.
 *
 * - 보너스 번호는 표시하지 않는다(요구사항 10).
 * - 누적·카이제곱 등 분석 페이지와 동일한 톤·여백 토큰을 사용해 시각 일관성을 유지한다.
 */
export function SearchPanel({
  availableDraws,
  selectedDraw,
  onSelectedDrawChange,
  onSearch,
  isLoadingDraws,
  isSearching,
  isLoadingWinningNumber,
  winningNumberError,
  selectedWinningNumber,
  selectedMainNumbers,
  searchError,
}: SearchPanelProps) {
  const isDrawSelectDisabled = isLoadingDraws || availableDraws.length === 0;
  const isSearchDisabled = !selectedDraw || isDrawSelectDisabled || isSearching;
  const searchButtonClassName = `h-[44px] px-5 rounded-xl font-semibold text-sm transition-all ${
    !isSearchDisabled
      ? 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:border-primary/60 cursor-pointer'
      : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
  }`;

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <label className="flex flex-col gap-2 text-sm text-slate-300 min-w-[180px]">
            <span className="font-medium">회차 선택</span>
            <select
              value={selectedDraw}
              onChange={(e) => onSelectedDrawChange(e.target.value)}
              disabled={isDrawSelectDisabled}
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
          <button
            type="button"
            onClick={onSearch}
            disabled={isSearchDisabled}
            className={searchButtonClassName}
          >
            조회
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 min-h-[74px] lg:min-w-[440px]">
          <p className="text-xs font-medium text-slate-300 mb-2">선택 회차 당첨번호 (보너스 제외)</p>
          <SelectedMainNumbersStrip
            isLoadingWinningNumber={isLoadingWinningNumber}
            winningNumberError={winningNumberError}
            selectedWinningNumber={selectedWinningNumber}
            selectedMainNumbers={selectedMainNumbers}
          />
        </div>
      </div>

      {searchError && <p className="text-sm text-rose-300">{searchError}</p>}
    </section>
  );
}

type SelectedMainNumbersStripProps = {
  isLoadingWinningNumber: boolean;
  winningNumberError: string | null;
  selectedWinningNumber: WinningNumberRow | null;
  selectedMainNumbers: number[];
};

/** 본번호 6개 칩 표시 — 보너스 번호는 의도적으로 표시하지 않는다. */
function SelectedMainNumbersStrip({
  isLoadingWinningNumber,
  winningNumberError,
  selectedWinningNumber,
  selectedMainNumbers,
}: SelectedMainNumbersStripProps) {
  if (isLoadingWinningNumber) {
    return <p className="text-sm text-slate-300">당첨번호를 불러오는 중입니다...</p>;
  }

  if (winningNumberError) {
    return <p className="text-sm text-rose-300">{winningNumberError}</p>;
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
    </div>
  );
}
