import type { SumExtremeStats } from '../../../types';

type Props = {
  stats: SumExtremeStats;
};

export function HighLowSumIntro({ stats }: Props) {
  return (
    <>
      <div>
        <h3 className="text-xl font-semibold text-white">고저 합산</h3>
        <p className="text-xs text-slate-400 mt-1">
          표본: DB에 저장된 최근 26회(6개월) 당첨 주번호 6개(num1~num6)만 합산합니다. 보너스 번호는 제외합니다. 합산이
          같으면 회차 번호(draw_no) 오름차순으로 극단 회차를 고릅니다.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          고: 합을 <span className="text-slate-300">큰 순</span>으로 두면 앞쪽{' '}
          <span className="tabular-nums">ceil(5% × n)</span>회차(가장 큰 합)를 빼고, 남은 합 중{' '}
          <span className="text-slate-300">최댓값</span>. 저: 합을 <span className="text-slate-300">작은 순</span>
          으로 두면 맨 앞이 가장 낮은 합이므로, 그 앞쪽 <span className="tabular-nums">ceil(5% × n)</span>회차를
          빼고 남은 합 중 <span className="text-slate-300">최솟값</span>입니다. 저는 낮은 쪽을 더 많이 자를수록
          남은 쪽 최소가 위로 올라가므로(예: 98→113) 숫자가 커지는 것이 맞습니다. 최근 회차(최대 26회)는{' '}
          <span className="text-slate-300">≥ 고</span>, <span className="text-slate-300">≤ 저</span> 건수입니다.
        </p>
      </div>
      <p className="text-[11px] text-slate-500">
        집계 회차 {stats.totalDraws.toLocaleString()}건 · 고 제외{' '}
        <span className="tabular-nums">{stats.extremeKHigh}</span>건 · 저 제외{' '}
        <span className="tabular-nums">{stats.extremeKLow}</span>건
      </p>
    </>
  );
}
