import type { StreakResult } from '../types';
import { StreakResultsStatus } from './StreakResultsStatus';
import { StreakTableRow } from './StreakTableRow';

// 번호별 연속 출현 분석 결과 표 영역입니다.
// 표 머리글과 상태 분기만 담당하고, 각 줄 그리기는 StreakTableRow에 맡깁니다.

type StreakTableProps = {
  hasSearched: boolean;
  noHistory: boolean;
  isSearching: boolean;
  searchError: string | null;
  streakResults: StreakResult[];
};

export const StreakTable = ({
  hasSearched,
  noHistory,
  isSearching,
  searchError,
  streakResults,
}: StreakTableProps) => (
  <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
    <h3 className="text-xl font-semibold text-white">연속 출현 분석 결과</h3>
    <StreakResultsStatus
      hasSearched={hasSearched}
      noHistory={noHistory}
      isSearching={isSearching}
      searchError={searchError}
      hasResults={streakResults.length > 0}
      idleHint="조회를 실행하면 번호별 연속 출현 결과 테이블이 표시됩니다."
      loadingHint="데이터를 계산하는 중입니다..."
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[480px]">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="py-2 pr-3 font-medium w-12">번호</th>
              <th className="py-2 pr-3 font-medium text-right">연속 구간 시작 회차</th>
              <th className="py-2 pr-3 font-medium text-right">연속 출현 (연속−1)</th>
              <th className="py-2 font-medium text-center">판정</th>
            </tr>
          </thead>
          <tbody>
            {streakResults.map((row) => (
              <StreakTableRow key={row.number} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </StreakResultsStatus>
  </section>
);
