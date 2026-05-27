import type { SumExtremeStats } from '../../types';
import { HighLowSumIntro } from './highLow/HighLowSumIntro';

type Props = {
  stats: SumExtremeStats | null;
};

/** 전체 회차 주6 합산 기준 고(큰 합 쪽 제외)·저(작은 합 순 앞쪽 제외) 트림 값 및 최근 창 건수 */
export function HighLowSumTable({ stats }: Props) {
  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      {stats === null || stats.totalDraws === 0 ? (
        <>
          <div>
            <h3 className="text-xl font-semibold text-white">고저 합산</h3>
          </div>
          <p className="text-sm text-slate-300">집계할 당첨 이력이 없습니다.</p>
        </>
      ) : (
        <>
          <HighLowSumIntro stats={stats} />
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
