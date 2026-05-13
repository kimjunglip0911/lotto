import type { StreakSearchProps, StreakSummaryProps, StreakTableProps } from '../types';
import { SearchBar } from './search/SearchBar';
import { ColdNums } from './summary/ColdNums';
import { SumCards } from './summary/SumCards';
import { StreakTbl } from './table/StreakTbl';
import { StatNote } from './StatNote';

// 화면 본문(main 안쪽)을 조립하는 컴포넌트입니다.
// 검색·요약·표 세 묶음의 props를 받아 순서대로 배치합니다.

export type StreakMainProps = {
  search: StreakSearchProps;
  summary: StreakSummaryProps;
  table: StreakTableProps;
};

export const StreakMain = ({ search, summary, table }: StreakMainProps) => {
  const { canShowStreakPanels, coldNumbers, averageStreak, analyzedDrawCount, maxStreak } = summary;
  return (
    <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
      <SearchBar {...search} />
      {canShowStreakPanels && <SumCards analyzedDrawCount={analyzedDrawCount} maxStreak={maxStreak} />}
      {canShowStreakPanels && <ColdNums coldNumbers={coldNumbers} averageStreak={averageStreak} />}
      <StreakTbl {...table} />
      <StatNote />
    </main>
  );
};
