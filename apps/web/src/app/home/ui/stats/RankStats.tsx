'use client';

/**
 * 입력한 당첨번호를 기준으로, 현재 화면에 있는 세트들의 당첨 통계를 보여준다.
 * 이 파일은 "통계 계산 결과를 받아 화면 분기를 고르는 역할"만 담당한다.
 * 실제 안내 문구 표시는 `RankGuide`, 요약/목록 표시는 `RankSummary`·`RankList`가 담당한다.
 */

import { useMemo } from 'react';

import { RankGuide } from '@/app/home/ui/stats/RankGuide';
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

  const hasWins = stats.canCalculate;

  return (
    <div className="mt-2 bg-card/50 border border-card-border/50 rounded-3xl p-6 md:p-7 relative overflow-hidden">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">analytics</span>
        현재 조회된 {stats.totalSets}세트 당첨 결과
      </h3>
      {!hasWins ? (
        <RankGuide />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RankSummary totalSets={stats.totalSets} rankCounts={stats.rankCounts} />
          <RankList setRankings={stats.setRankings} />
        </div>
      )}
    </div>
  );
}
