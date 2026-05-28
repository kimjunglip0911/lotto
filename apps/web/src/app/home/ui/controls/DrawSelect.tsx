/**
 * 홈 화면에서 회차를 고르는 선택 상자입니다.
 * 비어 있는 값을 고르면 선택 해제(null)로 전달하고,
 * 숫자를 고르면 해당 회차 번호를 숫자로 바꿔 부모 화면에 전달합니다.
 * 전달에 실패할 상황은 거의 없지만, 목록이 비어 있으면 "데이터 없음"만 보입니다.
 */

interface DrawSelectProps {
  selectedDraw: number | null;
  availableDraws: number[];
  onSelectDraw: (value: number | null) => void;
}

const toDrawValue = (raw: string): number | null => (raw === "" ? null : Number.parseInt(raw, 10));

export function DrawSelect({ selectedDraw, availableDraws, onSelectDraw }: DrawSelectProps) {
  const handleChange = (raw: string) => onSelectDraw(toDrawValue(raw));

  return (
    <div className="flex items-center gap-3 w-full xl:w-auto justify-center xl:justify-start">
      <span className="text-white/60 font-medium whitespace-nowrap">회차 검색</span>
      <select
        value={selectedDraw ?? ""}
        onChange={(e) => {
          handleChange(e.target.value);
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
