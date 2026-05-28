'use client';

/** 입력한 당첨번호 기준, 가져온 세트의 등수·당첨 통계 패널 */

import { useMemo } from 'react';

import { calcRankStats } from '../../logic/rankStats';
import type { InputNumber, LotterySetViewModel } from '../../types/home';
import { RankList } from './RankList';
import { RankSummary } from './RankSummary';

interface RankStatsProps {
  sets: LotterySetViewModel[];
  winningNumbers: InputNumber[];
  bonusNumber: InputNumber;
}

export function RankStats({ sets, winningNumbers, bonusNumber }: RankStatsProps) {
  const stats = useMemo(
    () => calcRankStats(sets, winningNumbers, bonusNumber),
    [sets, winningNumbers, bonusNumber],
  );

  if (!stats || stats.totalSets === 0) return null;

  return (
    <div className="mt-2 bg-card/50 border border-card-border/50 rounded-3xl p-6 md:p-7 relative overflow-hidden">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">analytics</span>
        현재 조회된 {stats.totalSets}세트 당첨 결과
      </h3>
      {!stats.canCalculate ? (
        <div className="text-center py-8 text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">info</span>
          <p>정확한 당첨 번호 6개와 보너스 번호가 입력되면 당첨 통계가 표시됩니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RankSummary totalSets={stats.totalSets} rankCounts={stats.rankCounts} />
          <RankList setRankings={stats.setRankings} />
        </div>
      )}
    </div>
  );
}
