import type { ChiSquareData } from '../hooks/useChiSquareData';
import type { ChiSquareView } from '../hooks/useChiSquareDerived';
import { DeviationChart } from './chart/DeviationChart';
import { ChiSearchPanel } from './search/ChiSearchPanel';
import { StatisticalNote } from './StatisticalNote';
import { SummaryCards } from './SummaryCards';
import { RelPctBinWalkForwardTable } from './table/RelPctBinWalkForwardTable';
import { ResultTable } from './table/ResultTable';
import { WfExclusionBadges } from './WfExclusionBadges';

type Props = { data: ChiSquareData; view: ChiSquareView };

export const ChiMain = ({ data, view }: Props) => {
  const showSummary =
    view.hasSearched && !view.noHistory && !data.isSearching && !data.searchError && data.chiSquareResults.length > 0;
  const showWfTable =
    view.hasSearched && !view.noHistory && !data.isSearching && !data.searchError && view.relPctBinWalkForwardPresentation;
  const showExclusion =
    view.hasSearched && !view.noHistory && !data.isSearching && !data.searchError && view.walkForwardExcludedSplit;

  return (
    <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
      <ChiSearchPanel data={data} view={view} />
      {showSummary && (
        <SummaryCards
          analyzedDrawCount={data.analyzedDrawCount}
          expected={view.expected}
          chiSquareThreshold={view.chiSquareThreshold}
        />
      )}
      {showWfTable && <RelPctBinWalkForwardTable view={view} />}
      {showExclusion && <WfExclusionBadges view={view} />}
      <DeviationChart data={data} view={view} />
      <ResultTable data={data} view={view} />
      <StatisticalNote />
    </main>
  );
};
