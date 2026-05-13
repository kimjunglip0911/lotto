import type { AccuData } from '../hooks/useAccData';
import type { AccuView } from '../hooks/useAccView';
import { AccumulatedChartSection } from './chart/AccuChart';
import { AccSearchBlock } from './search/AccSearchBlock';
import { AccExclBox } from './strategy/AccExclBox';
import { AccFinalBox } from './strategy/AccFinalBox';
import { AccStratCharts } from './strategy/AccStratCharts';
import { AccStratNote } from './strategy/AccStratNote';

/** 누적 번호 분석 화면의 본문(main)을 조립합니다. 검색·안내·차트·극값 제외·전략·채택 블록 순으로 배치합니다. */

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
      <AccExclBox
        exclusion={data.accumulatedCountExclusion}
        hasSearched={view.hasSearched}
        drawNo={view.selectedSearchDrawNo}
        mainWinSet={view.mainWinSet}
      />
    )}

    <AccStratNote />
    <AccStratCharts data={data} view={view} />

    {view.finalNumberPlan && (
      <AccFinalBox
        plan={view.finalNumberPlan}
        hasSearched={view.hasSearched}
        drawNo={view.selectedSearchDrawNo}
        mainWinSet={view.mainWinSet}
      />
    )}
  </main>
);
