import type { WinningNumberRow } from '../types';

type SearchPanelProps = {
  availableDraws: number[];
  selectedDraw: string;
  onSelectedDrawChange: (value: string) => void;
  onSearch: () => void;
  isLoadingDraws: boolean;
  isSearching: boolean;
  isLoadingSelectedWinningNumber: boolean;
  selectedWinningNumberError: string | null;
  selectedWinningNumber: WinningNumberRow | null;
  selectedMainNumbers: number[];
  showSaveSnapshot?: boolean;
  onSaveSnapshot?: () => void;
  isSavingSnapshot?: boolean;
  saveSnapshotMessage?: string | null;
  saveSnapshotError?: string | null;
};

const renderWinningNumbersContent = ({
  isLoadingSelectedWinningNumber,
  selectedWinningNumberError,
  selectedWinningNumber,
  selectedMainNumbers,
}: Pick<
  SearchPanelProps,
  'isLoadingSelectedWinningNumber' | 'selectedWinningNumberError' | 'selectedWinningNumber' | 'selectedMainNumbers'
>) => {
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
};

export function SearchPanel({
  availableDraws,
  selectedDraw,
  onSelectedDrawChange,
  onSearch,
  isLoadingDraws,
  isSearching,
  isLoadingSelectedWinningNumber,
  selectedWinningNumberError,
  selectedWinningNumber,
  selectedMainNumbers,
  showSaveSnapshot = false,
  onSaveSnapshot,
  isSavingSnapshot = false,
  saveSnapshotMessage = null,
  saveSnapshotError = null,
}: SearchPanelProps) {
  const isDrawSelectDisabled = isLoadingDraws || availableDraws.length === 0;
  const isSearchDisabled = !selectedDraw || isDrawSelectDisabled || isSearching;
  const searchButtonClassName = `h-[44px] px-5 rounded-xl font-semibold text-sm transition-all ${
    !isSearchDisabled
      ? 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:border-primary/60 cursor-pointer'
      : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
  }`;
  const isSaveDisabled = !showSaveSnapshot || isSavingSnapshot || isSearching || !onSaveSnapshot;
  const saveButtonClassName = `h-[44px] px-5 rounded-xl font-semibold text-sm transition-all ${
    !isSaveDisabled
      ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/40 hover:bg-emerald-500/25 cursor-pointer'
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
          {showSaveSnapshot && (
            <button
              type="button"
              onClick={onSaveSnapshot}
              disabled={isSaveDisabled}
              className={saveButtonClassName}
            >
              {isSavingSnapshot ? '저장 중…' : '분석 결과 저장'}
            </button>
          )}
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 min-h-[74px] lg:min-w-[440px]">
          <p className="text-xs font-medium text-slate-300 mb-2">선택 회차 당첨번호 (보너스 포함)</p>
          {renderWinningNumbersContent({
            isLoadingSelectedWinningNumber,
            selectedWinningNumberError,
            selectedWinningNumber,
            selectedMainNumbers,
          })}
        </div>
      </div>
      {(saveSnapshotMessage || saveSnapshotError) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {saveSnapshotMessage && <p className="text-emerald-300">{saveSnapshotMessage}</p>}
          {saveSnapshotError && <p className="text-rose-300">{saveSnapshotError}</p>}
        </div>
      )}
    </section>
  );
}
