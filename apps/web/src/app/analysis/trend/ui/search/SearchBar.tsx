import type { WinningNumberRow } from '../../types';

type Props = {
  selectedDraw: string;
  onChangeSelectedDraw: (value: string) => void;
  availableDraws: number[];
  isLoadingDraws: boolean;
  isSearching: boolean;
  onSearch: () => void;
  isLoadingWinningNumber: boolean;
  winningNumberError: string | null;
  selectedWinningNumber: WinningNumberRow | null;
  selectedMainNumbers: number[];
  statusMessage: string | null;
};

export function SearchBar({
  selectedDraw,
  onChangeSelectedDraw,
  availableDraws,
  isLoadingDraws,
  isSearching,
  onSearch,
  isLoadingWinningNumber,
  winningNumberError,
  selectedWinningNumber,
  selectedMainNumbers,
  statusMessage,
}: Props) {
  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <label className="flex flex-col gap-2 text-sm text-slate-300 min-w-[180px]">
            <span className="font-medium">회차 선택</span>
            <select
              value={selectedDraw}
              onChange={(e) => onChangeSelectedDraw(e.target.value)}
              disabled={isLoadingDraws || availableDraws.length === 0}
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
            disabled={!selectedDraw || isLoadingDraws || availableDraws.length === 0 || isSearching}
            className={`h-[44px] px-5 rounded-xl font-semibold text-sm transition-all ${
              selectedDraw && !isLoadingDraws && availableDraws.length > 0 && !isSearching
                ? 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:border-primary/60 cursor-pointer'
                : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
            }`}
          >
            조회
          </button>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 min-h-[74px] lg:min-w-[440px]">
          <p className="text-xs font-medium text-slate-300 mb-2">선택 회차 당첨번호 (보너스 포함)</p>
          {isLoadingWinningNumber ? (
            <p className="text-sm text-slate-300">당첨번호를 불러오는 중입니다...</p>
          ) : winningNumberError ? (
            <p className="text-sm text-rose-300">{winningNumberError}</p>
          ) : selectedWinningNumber ? (
            <div className="flex flex-wrap items-center gap-2">
              {selectedMainNumbers.map((num, index) => (
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
      </div>
      {statusMessage && <p className="text-slate-300 text-sm leading-relaxed">{statusMessage}</p>}
    </section>
  );
}
