/** 등수별 당첨 횟수·비율 요약 패널 */

import type { RankCounts } from '../../types/home';

interface RankSummaryProps {
  totalSets: number;
  rankCounts: RankCounts;
}

export function RankSummary({ totalSets, rankCounts }: RankSummaryProps) {
  return (
    <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
      <h4 className="text-base text-slate-300 font-semibold mb-4">
        전체 대비 당첨 확률 (총 {totalSets}세트)
      </h4>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((rank) => {
          const count = rankCounts[rank as keyof RankCounts];
          const percent = ((count / totalSets) * 100).toFixed(1);
          return (
            <div key={rank} className="flex items-center justify-between text-base">
              <div className="flex items-center gap-3">
                <span
                  className={`w-12 text-center font-bold px-2 py-0.5 rounded-md ${
                    count > 0
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {rank}등
                </span>
                <span className="text-white/80">{count}회 당첨</span>
              </div>
              <span className="text-slate-400 font-mono">{percent}%</span>
            </div>
          );
        })}
        <div className="border-t border-white/10 pt-3 mt-3 flex items-center justify-between text-base">
          <span className="font-bold text-slate-500 w-12 text-center px-2">낙첨</span>
          <span className="text-white/60">{rankCounts.fail}회</span>
          <span className="text-slate-500 font-mono">
            {((rankCounts.fail / totalSets) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
