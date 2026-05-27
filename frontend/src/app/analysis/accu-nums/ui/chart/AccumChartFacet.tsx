import type { AccumulatedBarChartStats } from './accBarStat';
import { AccumChartBars } from './AccumChartBars';

/** 차트 안쪽만 담당합니다. 미조회·1회·로딩·오류·데이터 없음·막대 순서를 바꾸지 않습니다. */

type Props = {
  title: string;
  noDataMessage: string;
  hasSearched: boolean;
  selectedSearchDrawNo: number;
  isSearching: boolean;
  searchError: string | null;
  analyzedDrawCountForChart: number;
  selectedHighlightNumbers: Set<number> | null;
  stats: AccumulatedBarChartStats;
};

export const AccumChartFacet = ({
  title,
  noDataMessage,
  hasSearched,
  selectedSearchDrawNo,
  isSearching,
  searchError,
  analyzedDrawCountForChart,
  selectedHighlightNumbers,
  stats,
}: Props) =>
  hasSearched && selectedSearchDrawNo <= 1 ? (
    <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
  ) : !hasSearched ? (
    <p className="text-sm text-slate-300">조회를 실행하면 번호별 누적 막대 차트가 표시됩니다.</p>
  ) : isSearching ? (
    <p className="text-sm text-slate-300">차트 데이터를 계산하는 중입니다...</p>
  ) : searchError ? (
    <p className="text-sm text-rose-300">{searchError}</p>
  ) : analyzedDrawCountForChart <= 0 ? (
    <p className="text-sm text-slate-300">{noDataMessage}</p>
  ) : (
    <AccumChartBars title={title} stats={stats} selectedHighlightNumbers={selectedHighlightNumbers} />
  );
