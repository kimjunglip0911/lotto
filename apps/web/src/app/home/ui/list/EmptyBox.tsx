export function EmptyBox() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
      <span className="material-symbols-outlined text-5xl opacity-50 mb-2">
        hourglass_empty
      </span>
      <p className="text-lg">해당 회차에 분석된 데이터가 아직 없습니다.</p>
      <p className="text-sm opacity-60">
        분석/추출 기능 메뉴를 이용해 미리 세트를 생성해 보세요.
      </p>
    </div>
  );
}
