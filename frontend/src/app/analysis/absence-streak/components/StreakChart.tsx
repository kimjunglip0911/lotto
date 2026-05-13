import type { StreakResult } from '../types';
import { StreakChartBars } from './StreakChartBars';
import { StreakChartLegend } from './StreakChartLegend';
import { StreakResultsStatus } from './StreakResultsStatus';

// "번호별 연속 미출현 기간 차트" 영역 전체 틀입니다.
// 헤더(제목/범례)와 본문(막대 + 점선)을 합치고, 조회 상태에 따라 안내 문구로 갈아 끼웁니다.

type StreakChartProps = {
  hasSearched: boolean;
  noHistory: boolean;
  isSearching: boolean;
  searchError: string | null;
  streakResults: StreakResult[];
  maxStreak: number;
  top5PctThreshold: number;
  selectedWinningNumberSet: Set<number> | null;
};

export const StreakChart = ({
  hasSearched,
  noHistory,
  isSearching,
  searchError,
  streakResults,
  maxStreak,
  top5PctThreshold,
  selectedWinningNumberSet,
}: StreakChartProps) => (
  <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-2.5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-xl font-semibold text-white">번호별 연속 미출현 기간 차트</h3>
      {hasSearched && !noHistory && streakResults.length > 0 && <StreakChartLegend />}
    </div>
    <StreakResultsStatus
      hasSearched={hasSearched}
      noHistory={noHistory}
      isSearching={isSearching}
      searchError={searchError}
      hasResults={streakResults.length > 0}
      idleHint="조회를 실행하면 번호별 연속 미출현 기간 차트가 표시됩니다."
      loadingHint="차트 데이터를 계산하는 중입니다..."
    >
      <StreakChartBars
        streakResults={streakResults}
        maxStreak={maxStreak}
        top5PctThreshold={top5PctThreshold}
        selectedWinningNumberSet={selectedWinningNumberSet}
      />
    </StreakResultsStatus>
  </section>
);
