type Props = {
  expected: number;
  analyzedDrawCount: number;
  chiSquareThreshold: number;
  hasWinningHighlight: boolean;
  hasWfExclusion: boolean;
};

export function ResultCriteria({
  expected,
  analyzedDrawCount,
  chiSquareThreshold,
  hasWinningHighlight,
  hasWfExclusion,
}: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 space-y-2 mb-1">
      <p className="text-xs font-semibold text-slate-300">판정 기준값</p>
      <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-400">
        <span>
          기대값 <span className="font-semibold text-white">E = {expected.toFixed(2)}</span>
          <span className="text-slate-500 ml-1">({analyzedDrawCount}회 × 6 / 45)</span>
        </span>
        <span>
          유의 임계값 <span className="font-semibold text-amber-300">χ² ≥ {chiSquareThreshold}</span>
          <span className="text-slate-500 ml-1">(p &lt; 0.05, df=1)</span>
        </span>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1 border-t border-white/5">
        <span className="text-slate-500 w-full">행 정렬: 편차(O−E) 작은 순(음→양), 동률 시 번호 오름차순</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-rose-500/40 border border-rose-500/60" />
          저빈도: O &lt; {expected.toFixed(2)} AND χ² ≥ {chiSquareThreshold}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-blue-500/40 border border-blue-500/60" />
          고빈도: O &gt; {expected.toFixed(2)} AND χ² ≥ {chiSquareThreshold}
        </span>
        {hasWinningHighlight && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-amber-400/40 border border-amber-400/60" />
            선택 회차 본번호(보너스 제외)
          </span>
        )}
        {hasWfExclusion && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded ring-2 ring-rose-400/80 ring-offset-1 ring-offset-slate-900 bg-rose-500/30" />
            워크포워드 제외 번호
          </span>
        )}
      </div>
    </div>
  );
}
