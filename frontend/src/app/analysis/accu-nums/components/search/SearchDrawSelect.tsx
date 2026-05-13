/** 회차 드롭다운만 담당합니다. */

type Props = {
  availableDraws: number[];
  selectedDraw: string;
  onSelectedDrawChange: (value: string) => void;
  isLoadingDraws: boolean;
  isDrawSelectDisabled: boolean;
};

export const SearchDrawSelect = ({
  availableDraws,
  selectedDraw,
  onSelectedDrawChange,
  isLoadingDraws,
  isDrawSelectDisabled,
}: Props) => (
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
);
