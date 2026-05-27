'use client';

/** 회차 선택 드롭다운 */

type Props = {
  selectedDraw: number | null;
  onDrawChange: (draw: number) => void;
  isDisabled: boolean;
  isLoadingDraws: boolean;
  availableDraws: number[];
};

export const DrawSelector = ({
  selectedDraw,
  onDrawChange,
  isDisabled,
  isLoadingDraws,
  availableDraws,
}: Props) => (
  <label className="flex flex-col gap-2 text-sm text-slate-300 min-w-[180px]">
    <span className="font-medium">회차 선택</span>
    <select
      value={selectedDraw ?? ''}
      onChange={(e) => onDrawChange(Number(e.target.value))}
      disabled={isDisabled}
      className="bg-slate-900 border border-white/20 rounded-xl px-4 py-2.5 text-white font-semibold focus:border-primary outline-none transition-all cursor-pointer shadow-inner"
    >
      {isLoadingDraws ? <option value="">회차 정보를 불러오는 중...</option> : null}
      {!isLoadingDraws && availableDraws.length === 0 ? (
        <option value="">조회 가능한 회차 없음</option>
      ) : null}
      {availableDraws.map((drawNo) => (
        <option key={drawNo} value={drawNo}>
          {drawNo}회
        </option>
      ))}
    </select>
  </label>
);
