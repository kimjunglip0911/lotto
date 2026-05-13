import type { AccuData } from '../../hooks/useAccData';
import type { AccuView } from '../../hooks/useAccView';
import { AccumulatedChartSection } from '../chart/AccuChart';

/** 2년·기타 창별 누적 막대 차트를 `strategyCharts` 순서대로 그립니다. */

export const AccStratCharts = ({ data, view }: { data: AccuData; view: AccuView }) =>
  view.strategyCharts.map((chart) => (
    <AccumulatedChartSection
      key={chart.key}
      title={chart.title}
      counts={chart.counts}
      analyzedDrawCountForChart={chart.analyzedDrawCount}
      noDataMessage={chart.noDataMessage}
      hasSearched={view.hasSearched}
      selectedSearchDrawNo={view.selectedSearchDrawNo}
      isSearching={data.isSearching}
      searchError={data.searchError}
      selectedHighlightNumbers={view.selectedHighlightNumbers}
    />
  ));
