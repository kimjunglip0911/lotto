// 회차를 고르고 "조회" 버튼을 누르는 영역. 로딩·검색 중이면 버튼이 비활성화됩니다.

type DrawSelectorProps = {
  availableDraws: number[];
  selectedDraw: string;
  onSelectedDrawChange: (draw: string) => void;
  isLoadingDraws: boolean;
  isSearching: boolean;
  onSearch: () => void;
};

export const DrawSelector = ({
  availableDraws,
  selectedDraw,
  onSelectedDrawChange,
  isLoadingDraws,
  isSearching,
  onSearch,
}: DrawSelectorProps) => {
  const isReady = !!selectedDraw && !isLoadingDraws && availableDraws.length > 0 && !isSearching;
  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
      <label className="flex flex-col gap-2 text-sm text-slate-300 min-w-[180px]">
        <span className="font-medium">회차 선택</span>
        <select
          value={selectedDraw}
          onChange={(e) => onSelectedDrawChange(e.target.value)}
          disabled={isLoadingDraws || availableDraws.length === 0}
          className="bg-slate-900 border border-white/20 rounded-xl px-4 py-2.5 text-white font-semibold focus:border-primary outline-none transition-all cursor-pointer shadow-inner"
        >
          {isLoadingDraws && <option value="">회차 정보를 불러오는 중...</option>}
          {!isLoadingDraws && availableDraws.length === 0 && (
            <option value="">당첨 이력 없음(홈에서 저장)</option>
          )}
          {availableDraws.map((drawNo) => <option key={drawNo} value={drawNo}>{drawNo}회</option>)}
        </select>
      </label>
      <button
        type="button"
        onClick={onSearch}
        disabled={!isReady}
        className={`h-[44px] px-5 rounded-xl font-semibold text-sm transition-all ${
          isReady
            ? 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:border-primary/60 cursor-pointer'
            : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
        }`}
      >
        조회
      </button>
    </div>
  );
};
