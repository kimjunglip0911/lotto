/**
 * 사용자가 만든 전체 세트를 기준으로, 1~5등과 낙첨의 횟수와 비율을 한눈에 보여 주는 요약 화면입니다.
 * 이 파일은 화면 표시만 담당하고, 퍼센트 계산과 배지 색상 규칙은 아래 작은 함수로 분리해 읽기 쉽게 유지합니다.
 * 총 세트 수가 0이어도 화면이 깨지지 않도록 비율을 0.0%로 안전하게 표시합니다.
 */

import type { RankCounts } from '../../types/home';

interface RankSummaryProps {
  totalSets: number;
  rankCounts: RankCounts;
}

const RANKS = [1, 2, 3, 4, 5] as const;

const ACTIVE_BADGE_CLASS = 'bg-primary/20 text-primary border border-primary/30';
const INACTIVE_BADGE_CLASS = 'bg-slate-800 text-slate-500';

const getPercentText = (count: number, totalSets: number) => {
  if (totalSets <= 0)
    return '0.0';
  return ((count / totalSets) * 100).toFixed(1);
};

const getBadgeClass = (count: number) =>
  count > 0 ? ACTIVE_BADGE_CLASS : INACTIVE_BADGE_CLASS;

export function RankSummary({ totalSets, rankCounts }: RankSummaryProps) {
  return (
    <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
      <h4 className="text-base text-slate-300 font-semibold mb-4">
        전체 대비 당첨 확률 (총 {totalSets}세트)
      </h4>
      <div className="space-y-3">
        {RANKS.map((rank) => {
          const count = rankCounts[rank as keyof RankCounts];
          const percent = getPercentText(count, totalSets);
          return (
            <div key={rank} className="flex items-center justify-between text-base">
              <div className="flex items-center gap-3">
                <span
                  className={`w-12 text-center font-bold px-2 py-0.5 rounded-md ${getBadgeClass(count)}`}
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
            {getPercentText(rankCounts.fail, totalSets)}%
          </span>
        </div>
      </div>
    </div>
  );
}
