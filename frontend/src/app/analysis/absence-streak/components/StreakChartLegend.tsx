// 차트에서 어떤 색이 무엇을 뜻하는지 알려 주는 작은 설명표입니다.
// 색상 4종(선택 회차 / 저빈도 / 일반 / 상위 5% 점선) 의미만 표시합니다.

export const StreakChartLegend = () => (
  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded bg-amber-400/50 border border-amber-400/70" />
      선택 회차 당첨번호
    </span>
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded bg-orange-500/70 border border-orange-500/90" />
      저빈도 후보 (평균 초과)
    </span>
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded bg-indigo-500/60 border border-indigo-500/80" />
      일반 미출현
    </span>
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-6 border-t-2 border-dashed border-violet-400/80" />
      상위 5%
    </span>
  </div>
);
