import type { AccuData } from '../hooks/useAccData';
import type { AccuView } from '../hooks/useAccView';
import { AccumulatedExclusionCard } from '@/app/analysis/final-pick/components/AccumulatedExclusionCard';
import { AccumulatedChartSection } from './chart/AccuChart';
import { AccSearchBlock } from './search/AccSearchBlock';

/** 누적 번호 분석 화면의 본문(main)을 조립합니다. 검색·차트·통합과 동일한 극값 제외 블록 순으로 배치합니다. */

export const AccuMain = ({ data, view }: { data: AccuData; view: AccuView }) => (
  <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
    <AccSearchBlock data={data} view={view} />

    <AccumulatedChartSection
      title="번호별 누적 출현 횟수"
      counts={data.allTimeCountResult.counts}
      analyzedDrawCountForChart={data.allTimeCountResult.analyzedDrawCount}
      noDataMessage="저장된 당첨번호 기준으로 집계 가능한 이전 회차 데이터가 없습니다."
      hasSearched={view.hasSearched}
      selectedSearchDrawNo={view.selectedSearchDrawNo}
      isSearching={data.isSearching}
      searchError={data.searchError}
      selectedHighlightNumbers={view.selectedHighlightNumbers}
    />

    {data.accumulatedCountExclusion && view.hasSearched && view.selectedSearchDrawNo > 1 && (
      <AccumulatedExclusionCard exclusion={data.accumulatedCountExclusion} mainWinningSet={view.mainWinSet} />
    )}
  </main>
);
