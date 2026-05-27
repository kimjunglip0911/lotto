import {
  CHI_SQUARE_DEVIATION_BIN_WIDTH,
  CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_OVERLAP_ROUNDS,
  CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_PCT_NUMERATOR,
} from '../constants';
import type { ChiSquareView } from '../hooks/useChiSquareDerived';

type Props = { view: ChiSquareView };

export function WfExclusionBadges({ view }: Props) {
  const split = view.walkForwardExcludedSplit;
  if (!split) return null;

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 space-y-4">
        <p className="text-sm font-semibold text-rose-200">워크포워드 후보 제외(사유별)</p>
        <div className="space-y-2">
          <p className="text-xs font-medium text-rose-100/95">
            조건부 확률 {CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_PCT_NUMERATOR}% 이하 —{' '}
            {split.byConditionalPct.length}개
          </p>
          <div className="flex flex-wrap gap-2">
            {split.byConditionalPct.map((n) => (
              <span
                key={`wf-ex-pct-${n}`}
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-rose-400/25 px-2 text-sm font-bold text-rose-100"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-2 border-t border-rose-400/20 pt-3">
          <p className="text-xs font-medium text-rose-100/95">
            겹침 회차 {CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_OVERLAP_ROUNDS}회 이하 —{' '}
            {split.byOverlapRounds.length}개
          </p>
          <div className="flex flex-wrap gap-2">
            {split.byOverlapRounds.map((n) => (
              <span
                key={`wf-ex-ov-${n}`}
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-rose-400/20 px-2 text-sm font-bold text-rose-50"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs text-rose-100/85 leading-relaxed">
          편차(O−E) 워크포워드 표와 동일한 집계(조회 회차 직전까지 전체 기간, 구간 폭 {CHI_SQUARE_DEVIATION_BIN_WIDTH}
          )입니다. 한 번호가 두 조건을 모두 만족하면 두 목록에 모두 나옵니다. 조회 시점 각 번호의 편차(O−E)는 검정 결과
          표와 같이 전체 누적 기준입니다.
        </p>
      </div>
    </section>
  );
}
