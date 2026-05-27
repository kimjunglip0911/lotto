'use client';

import {
  CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_OVERLAP_ROUNDS,
  CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_PCT_NUMERATOR,
} from '@/app/analysis/chi-square/constants';
import type { useFinalPickData } from '../hooks/useFinalPickData';
import { useFinalPickView } from '../hooks/useFinalPickView';
import { AccumulatedExclusionCard } from './cards/AccumulatedExclusionCard';
import { SourceNumbersCard } from './cards/SourceNumbersCard';
import { ComprehensiveChart } from './chart/ComprehensiveChart';
import { SearchPanel } from './search/SearchPanel';
import { AdoptedSummaryCard } from './summary/AdoptedSummaryCard';

type Props = { data: ReturnType<typeof useFinalPickData> };

/** 통합 분석 본문 — 검색·카드·종합 차트. */
export function FinalPickMain({ data }: Props) {
  const view = useFinalPickView(data);

  return (
    <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
      <SearchPanel
        availableDraws={data.availableDraws}
        selectedDraw={data.selectedDraw}
        onSelectedDrawChange={data.setSelectedDraw}
        onSearch={() => void data.handleSearch()}
        isLoadingDraws={data.isLoadingDraws}
        isSearching={data.isSearching}
        isLoadingWinningNumber={data.isLoadingWinningNumber}
        winningNumberError={data.winningNumberError}
        selectedWinningNumber={data.selectedWinningNumber}
        selectedMainNumbers={view.selectedMainNumbers}
        searchError={data.searchError ?? data.drawLoadError}
      />
      <AdoptedSummaryCard
        numbers={view.adoptedAllNumbers}
        targetCount={view.adoptedSummaryTargetCount}
        mainWinningSet={view.mainWinningNumberSet}
      />
      <ComprehensiveChart
        counts={data.comprehensiveChartCounts}
        analyzedDrawCountForChart={data.comprehensiveChartAnalyzedDrawCount}
        highlightedNumbers={view.mainWinningNumberSet}
        accumulatedExcludedNumbers={data.accumulatedExclusion.excludedUnique}
        chiSquareWalkForwardExcludedNumbers={view.chiSquareWalkForwardExcludedForChart}
        streakExcludedNumbers={data.excludedByStreakNumbers}
      />
      <SourceNumbersCard
        title="연속 미출현 분석 — 후보 제외"
        description="직전 회차에서 끝난 연속 출현(본번호 2회 이상)에 해당하면 후보에서 제외"
        tone="exclude"
        numbers={data.excludedByStreakNumbers}
        mainWinningSet={view.mainWinningNumberSet}
      />
      <AccumulatedExclusionCard exclusion={data.accumulatedExclusion} mainWinningSet={view.mainWinningNumberSet} />
      <ChiExcludeCards data={data} mainWinningSet={view.mainWinningNumberSet} />
    </main>
  );
}

function ChiExcludeCards({
  data,
  mainWinningSet,
}: {
  data: Props['data'];
  mainWinningSet: Set<number>;
}) {
  return (
    <>
      <SourceNumbersCard
        title="카이제곱 검정 — 제외(조건부 확률)"
        titleHint={`조건부 확률 ${CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_PCT_NUMERATOR}% 이하`}
        tone="exclude"
        numbers={data.excludedByChiSquareWalkForwardConditionalPct}
        mainWinningSet={mainWinningSet}
      />
      <SourceNumbersCard
        title="카이제곱 검정 — 제외(겹침 회차)"
        titleHint={`구간 출현 중 당첨 본번호 겹침 ${CHI_SQUARE_WALK_FORWARD_EXCLUSION_MAX_OVERLAP_ROUNDS}회 이하`}
        tone="exclude"
        numbers={data.excludedByChiSquareWalkForwardOverlapRounds}
        mainWinningSet={mainWinningSet}
      />
    </>
  );
}
