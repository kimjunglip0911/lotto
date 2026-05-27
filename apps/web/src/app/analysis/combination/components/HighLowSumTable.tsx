import type { SumExtremeStats } from '../types';

type Props = {
  stats: SumExtremeStats | null;
};

/** 전체 회차 주6 합산 기준 고(큰 합 쪽 제외)·저(작은 합 순 앞쪽 제외) 트림 값 및 최근 창 건수 */
export function HighLowSumTable({ stats }: Props) {
  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <div>
        <h3 className="text-xl font-semibold text-white">고저 합산</h3>
        <p className="text-xs text-slate-400 mt-1">
          표본: DB에 저장된 전체 회차의 당첨 주번호 6개(num1~num6)만 합산합니다. 보너스 번호는 제외합니다. 합산이
          같으면 회차 번호(draw_no) 오름차순으로 극단 회차를 고릅니다.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          고: 합을 <span className="text-slate-300">큰 순</span>으로 두면 앞쪽{' '}
          <span className="tabular-nums">ceil(10% × n)</span>회차(가장 큰 합)를 빼고, 남은 합 중{' '}
          <span className="text-slate-300">최댓값</span>. 저: 합을 <span className="text-slate-300">작은 순</span>
          으로 두면 맨 앞이 가장 낮은 합이므로, 그 앞쪽 <span className="tabular-nums">ceil(5% × n)</span>회차를
          빼고 남은 합 중 <span className="text-slate-300">최솟값</span>입니다. 저는 낮은 쪽을 더 많이 자를수록
          남은 쪽 최소가 위로 올라가므로(예: 98→113) 숫자가 커지는 것이 맞습니다. 최근 회차(최대 52회)는{' '}
          <span className="text-slate-300">≥ 고</span>, <span className="text-slate-300">≤ 저</span> 건수입니다.
        </p>
      </div>

      {stats === null || stats.totalDraws === 0 ? (
        <p className="text-sm text-slate-300">집계할 당첨 이력이 없습니다.</p>
      ) : (
        <>
          <p className="text-[11px] text-slate-500">
            집계 회차 {stats.totalDraws.toLocaleString()}건 · 고 제외{' '}
            <span className="tabular-nums">{stats.extremeKHigh}</span>건 · 저 제외{' '}
            <span className="tabular-nums">{stats.extremeKLow}</span>건
          </p>
          <div className="overflow-x-auto rounded-lg border border-card-border/20">
            <table className="w-full min-w-[360px] text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-card-border/30 bg-black/20">
                  <th scope="col" className="py-2 px-3 font-semibold text-slate-300">
                    구분
                  </th>
                  <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-right">
                    극단 제외 후 합산
                  </th>
                  <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-right">
                    최근 {stats.recentWindowSize}회 (≥고 / ≤저)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-card-border/15 bg-slate-800/35">
                  <td className="py-1.5 px-3 text-slate-200">고(상위 극단 쪽)</td>
                  <td className="py-1.5 px-3 text-right text-sky-300 tabular-nums font-medium">
                    {stats.trimmedMaxSum !== null ? stats.trimmedMaxSum.toLocaleString() : '—'}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-300 tabular-nums">
                    {stats.recentTopExtremeCount.toLocaleString()}회
                  </td>
                </tr>
                <tr className="border-b border-card-border/15 last:border-0 bg-slate-900/30">
                  <td className="py-1.5 px-3 text-slate-200">저(하위 극단 쪽)</td>
                  <td className="py-1.5 px-3 text-right text-sky-300 tabular-nums font-medium">
                    {stats.trimmedMinSum !== null ? stats.trimmedMinSum.toLocaleString() : '—'}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-300 tabular-nums">
                    {stats.recentBottomExtremeCount.toLocaleString()}회
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
