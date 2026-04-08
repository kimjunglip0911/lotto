'use client';

import React, { useMemo } from 'react';

interface LotterySet {
  numbers: number[];
  method?: string;
}

interface SimulationStatsProps {
  sets: LotterySet[];
  winningNumbers: number[];
  bonusNumber: number;
}

export function SimulationStats({ sets, winningNumbers, bonusNumber }: SimulationStatsProps) {
  const stats = useMemo(() => {
    if (!sets || sets.length === 0) return null;

    const rankCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, fail: 0 };
    const methodStats: Record<string, { total: number; wins: number }> = {};

    const winNums = winningNumbers.map((number) => parseInt(String(number), 10)).filter((number) => !isNaN(number));
    const winBonus = parseInt(String(bonusNumber), 10);
    const canCalculate = winNums.length === 6 && !winNums.some((number) => number === 0);

    sets.forEach((setInfo) => {
      const method = setInfo.method || '기본';
      if (!methodStats[method]) methodStats[method] = { total: 0, wins: 0 };
      methodStats[method].total += 1;

      if (canCalculate) {
        const setNumbers = setInfo.numbers.map((number) => parseInt(String(number), 10));
        const matchCount = setNumbers.filter((number) => winNums.includes(number)).length;
        const isBonusMatched = setNumbers.includes(winBonus);

        let rank = 0;
        if (matchCount === 6) rank = 1;
        else if (matchCount === 5 && isBonusMatched) rank = 2;
        else if (matchCount === 5) rank = 3;
        else if (matchCount === 4) rank = 4;
        else if (matchCount === 3) rank = 5;

        if (rank > 0) {
          rankCounts[rank as keyof typeof rankCounts]++;
          methodStats[method].wins += 1;
        } else {
          rankCounts.fail++;
        }
      }
    });

    const totalSets = sets.length;
    const methodRankings = Object.entries(methodStats)
      .map(([method, data]) => ({
        method,
        total: data.total,
        wins: data.wins,
        winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate);

    return {
      canCalculate,
      totalSets,
      rankCounts,
      methodRankings,
    };
  }, [sets, winningNumbers, bonusNumber]);

  if (!stats || stats.totalSets === 0) return null;

  return (
    <div className="mt-2 bg-card/50 border border-card-border/50 rounded-3xl p-6 md:p-7 relative overflow-hidden">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">analytics</span>
        현재 조회된 20세트 분석 결과
      </h3>

      {!stats.canCalculate ? (
        <div className="text-center py-8 text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">info</span>
          <p>정확한 당첨 번호 6개와 보너스 번호가 입력되면 당첨 통계가 표시됩니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
            <h4 className="text-base text-slate-300 font-semibold mb-4">
              전체 대비 당첨 확률 (총 {stats.totalSets}세트)
            </h4>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((rank) => {
                const count = stats.rankCounts[rank as keyof typeof stats.rankCounts];
                const percent = ((count / stats.totalSets) * 100).toFixed(1);
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
                <span className="text-white/60">{stats.rankCounts.fail}회</span>
                <span className="text-slate-500 font-mono">
                  {((stats.rankCounts.fail / stats.totalSets) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
            <h4 className="text-base text-slate-300 font-semibold mb-4">분석 기법별 당첨 성공률 순위</h4>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {stats.methodRankings.map((methodStat, index) => (
                <div key={index} className="flex flex-col gap-1 bg-white/5 p-3 rounded-xl">
                  <div className="flex justify-between items-center text-base">
                    <span className="text-primary font-medium truncate pr-2">
                      {index + 1}. {methodStat.method}
                    </span>
                    <span className="text-emerald-400 font-bold whitespace-nowrap">
                      {methodStat.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 flex justify-between">
                    <span>추천 {methodStat.total}건</span>
                    <span>당첨 {methodStat.wins}건 (1~5등)</span>
                  </div>
                </div>
              ))}
              {stats.methodRankings.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-4">표시할 통계가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

