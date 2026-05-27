/** 회차 선택 드롭다운 */

interface DrawSelectProps {
  selectedDraw: number | null;
  availableDraws: number[];
  onSelectDraw: (value: number | null) => void;
}

export function DrawSelect({ selectedDraw, availableDraws, onSelectDraw }: DrawSelectProps) {
  return (
    <div className="flex items-center gap-3 w-full xl:w-auto justify-center xl:justify-start">
      <span className="text-white/60 font-medium whitespace-nowrap">회차 검색</span>
      <select
        value={selectedDraw ?? ''}
        onChange={(e) => {
          const value = e.target.value;
          onSelectDraw(value === '' ? null : Number.parseInt(value, 10));
        }}
        className="bg-slate-900 border border-white/20 rounded-xl px-4 py-2.5 text-white font-bold focus:border-primary outline-none transition-all cursor-pointer min-w-[120px] shadow-inner"
      >
        {availableDraws.length === 0 && <option value="">데이터 없음</option>}
        {availableDraws.map((drawNo) => (
          <option key={drawNo} value={drawNo}>
            {drawNo}회
          </option>
        ))}
      </select>
    </div>
  );
}
