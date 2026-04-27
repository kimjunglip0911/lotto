'use client';

import React, { useMemo } from 'react';
import { calculateSimulationStats } from '@/app/home/components/utils/calculateSimulationStats';
import type { LotterySetViewModel } from '@/app/home/components/types';

interface SimulationStatsProps {
  sets: LotterySetViewModel[];
  winningNumbers: number[];
  bonusNumber: number;
}

export function SimulationStats({ sets, winningNumbers, bonusNumber }: SimulationStatsProps) {
  const stats = useMemo(() => calculateSimulationStats(sets, winningNumbers, bonusNumber), [sets, winningNumbers, bonusNumber]);

  if (!stats || stats.totalSets === 0) return null;

  return (
    <div className="mt-2 bg-card/50 border border-card-border/50 rounded-3xl p-6 md:p-7 relative overflow-hidden">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">analytics</span>
        현재 조회된 {stats.totalSets}세트 분석 결과
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
            <h4 className="text-base text-slate-300 font-semibold mb-4">당첨 세트 순위</h4>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {stats.setRankings.map((setStat, index) => (
                <div key={index} className="flex flex-col gap-1 bg-white/5 p-3 rounded-xl">
                  <div className="flex justify-between items-center text-base">
                    <span className="text-primary font-medium truncate pr-2">
                      {index + 1}. SET {setStat.setNumber}
                    </span>
                    <span className="text-emerald-400 font-bold whitespace-nowrap">{setStat.rank}등</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

