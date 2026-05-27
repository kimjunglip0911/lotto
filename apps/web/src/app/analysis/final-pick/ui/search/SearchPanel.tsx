import type { WinningNumberRow } from '../../types/winRow';
import { MainStrip } from './MainStrip';

type Props = {
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

/** 통합 분석 상단 — 회차 선택·조회·본번호 미리보기. */
export function SearchPanel(props: Props) {
  const isDrawSelectDisabled = props.isLoadingDraws || props.availableDraws.length === 0;
  const isSearchDisabled = !props.selectedDraw || isDrawSelectDisabled || props.isSearching;
  const btnClass = !isSearchDisabled
    ? 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:border-primary/60 cursor-pointer'
    : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed';

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <label className="flex flex-col gap-2 text-sm text-slate-300 min-w-[180px]">
            <span className="font-medium">회차 선택</span>
            <select
              value={props.selectedDraw}
              onChange={(e) => props.onSelectedDrawChange(e.target.value)}
              disabled={isDrawSelectDisabled}
              className="bg-slate-900 border border-white/20 rounded-xl px-4 py-2.5 text-white font-semibold focus:border-primary outline-none transition-all cursor-pointer shadow-inner"
            >
              {props.isLoadingDraws && <option value="">회차 정보를 불러오는 중...</option>}
              {!props.isLoadingDraws && props.availableDraws.length === 0 && (
                <option value="">조회 가능한 회차 없음</option>
              )}
              {props.availableDraws.map((drawNo) => (
                <option key={drawNo} value={drawNo}>
                  {drawNo}회
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={props.onSearch}
            disabled={isSearchDisabled}
            className={`h-[44px] px-5 rounded-xl font-semibold text-sm transition-all ${btnClass}`}
          >
            조회
          </button>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 min-h-[74px] lg:min-w-[440px]">
          <p className="text-xs font-medium text-slate-300 mb-2">선택 회차 당첨번호 (보너스 제외)</p>
          <MainStrip
            isLoadingWinningNumber={props.isLoadingWinningNumber}
            winningNumberError={props.winningNumberError}
            selectedWinningNumber={props.selectedWinningNumber}
            selectedMainNumbers={props.selectedMainNumbers}
          />
        </div>
      </div>
      {props.searchError && <p className="text-sm text-rose-300">{props.searchError}</p>}
    </section>
  );
}
