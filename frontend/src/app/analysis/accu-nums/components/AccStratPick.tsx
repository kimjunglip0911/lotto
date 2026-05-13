import type { StrategyNumberPick } from '../types';
import { AccNumHit } from './AccNumHit';

/** 평균근접 전략 한 줄(번호 칩·지표)을 카드로 보여 줍니다. */

type Props = {
  pick: StrategyNumberPick;
  showHit: boolean;
  mainWinSet: ReadonlySet<number>;
};

export const AccStratPick = ({ pick, showHit, mainWinSet }: Props) => (
  <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3 space-y-2">
    <p className="text-sm font-medium text-slate-100">
      {pick.strategyLabel} (이전 {pick.windowSizes.join(', ')}회)
    </p>
    <div className="flex flex-wrap gap-2 items-center">
      {[...pick.numbers].sort((a, b) => a - b).map((n) => (
        <AccNumHit key={`${pick.strategyKey}-${n}`} n={n} isHit={showHit && mainWinSet.has(n)} variant="strat" />
      ))}
    </div>
    <p className="text-xs text-slate-300">
      ≥1 적중률 {(pick.atLeastOneRate * 100).toFixed(2)}% / 평균 적중 {pick.avgHits.toFixed(3)} / 최대 연속 미적중{' '}
      {pick.maxMissStreak}회
    </p>
  </div>
);
