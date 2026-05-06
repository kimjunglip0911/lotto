'use client';

import React, { useMemo, useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { AccumulatedChartSection } from './components/AccumulatedChartSection';
import { SearchPanel } from './components/SearchPanel';
import { useAccumulatedNumbersData } from './hooks/useAccumulatedNumbersData';
import { useAccumulatedNumbersDerived } from './hooks/useAccumulatedNumbersDerived';

export default function AccumulatedNumbersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const data = useAccumulatedNumbersData();
  const {
    hasSearched,
    selectedSearchDrawNo,
    selectedMainNumbers,
    selectedHighlightNumbers,
    statusMessage,
    strategyCharts,
    finalNumberPlan,
  } = useAccumulatedNumbersDerived({
    availableDraws: data.availableDraws,
    selectedDraw: data.selectedDraw,
    isLoadingDraws: data.isLoadingDraws,
    drawLoadError: data.drawLoadError,
    isSearching: data.isSearching,
    searchError: data.searchError,
    searchedDraw: data.searchedDraw,
    selectedWinningNumber: data.selectedWinningNumber,
    windowCountResultMap: data.windowCountResultMap,
    strategyCharts: data.strategyCharts,
    finalNumberPlan: data.finalNumberPlan,
  });

  /** 본번호 6개만 — 보너스 제외, 채택 번호 적중 시 노란 공 표시용 */
  const mainWinningNumberSet = useMemo(() => new Set(selectedMainNumbers), [selectedMainNumbers]);

  const canSaveSnapshot =
    hasSearched &&
    !data.isSearching &&
    !data.searchError &&
    Number.isFinite(selectedSearchDrawNo) &&
    selectedSearchDrawNo > 1 &&
    finalNumberPlan != null &&
    finalNumberPlan.finalNumbers.length === 4;

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
          <SearchPanel
            availableDraws={data.availableDraws}
            selectedDraw={data.selectedDraw}
            onSelectedDrawChange={data.setSelectedDraw}
            onSearch={data.handleSearch}
            isLoadingDraws={data.isLoadingDraws}
            isSearching={data.isSearching}
            isLoadingSelectedWinningNumber={data.isLoadingSelectedWinningNumber}
            selectedWinningNumberError={data.selectedWinningNumberError}
            selectedWinningNumber={data.selectedWinningNumber}
            selectedMainNumbers={selectedMainNumbers}
            showSaveSnapshot={canSaveSnapshot}
            onSaveSnapshot={() => {
              void data.saveAccumulatedSnapshot();
            }}
            isSavingSnapshot={data.isSavingSnapshot}
            saveSnapshotMessage={data.saveSnapshotMessage}
            saveSnapshotError={data.saveSnapshotError}
          />
          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
            {statusMessage && <p className="text-slate-300 text-sm leading-relaxed">{statusMessage}</p>}
          </section>

          <AccumulatedChartSection
            title="번호별 누적 출현 횟수"
            counts={data.allTimeCountResult.counts}
            analyzedDrawCountForChart={data.allTimeCountResult.analyzedDrawCount}
            noDataMessage="저장된 당첨번호 기준으로 집계 가능한 이전 회차 데이터가 없습니다."
            hasSearched={hasSearched}
            selectedSearchDrawNo={selectedSearchDrawNo}
            isSearching={data.isSearching}
            searchError={data.searchError}
            selectedHighlightNumbers={selectedHighlightNumbers}
          />

          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">고도화 전략 분석 (2년 / 평균근접)</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              상단은 선택 회차 직전 전체 누적, 아래는 직전 104회차(2년) 구간만 막대 차트로 둡니다. 최종 채택 4개는 전체
              누적 출현 분포에 대해 평균근접 규칙으로 선정합니다.
            </p>
          </section>

          {strategyCharts.map((chart) => (
            <AccumulatedChartSection
              key={chart.key}
              title={chart.title}
              counts={chart.counts}
              analyzedDrawCountForChart={chart.analyzedDrawCount}
              noDataMessage={chart.noDataMessage}
              hasSearched={hasSearched}
              selectedSearchDrawNo={selectedSearchDrawNo}
              isSearching={data.isSearching}
              searchError={data.searchError}
              selectedHighlightNumbers={selectedHighlightNumbers}
            />
          ))}

          {finalNumberPlan && (
            <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">평균근접 채택 4개 (2년 · 전체)</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {finalNumberPlan.strategyPicks.map((pick) => (
                  <div key={pick.strategyKey} className="rounded-xl border border-white/10 bg-slate-900/50 p-3 space-y-2">
                    <p className="text-sm font-medium text-slate-100">
                      {pick.strategyLabel} (이전 {pick.windowSizes.join(', ')}회)
                    </p>
                    <div className="flex flex-wrap gap-2 items-center">
                      {[...pick.numbers].sort((a, b) => a - b).map((n) => {
                        const isMainWinHit =
                          hasSearched && selectedSearchDrawNo > 1 && mainWinningNumberSet.has(n);
                        return (
                          <span
                            key={`${pick.strategyKey}-${n}`}
                            className={
                              isMainWinHit
                                ? 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-slate-900 shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] ring-1 ring-amber-200/90'
                                : 'px-2 py-1 rounded-md text-xs font-semibold bg-primary/20 text-primary'
                            }
                          >
                            {n}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-300">
                      ≥1 적중률 {(pick.atLeastOneRate * 100).toFixed(2)}% / 평균 적중 {pick.avgHits.toFixed(3)} /
                      최대 연속 미적중 {pick.maxMissStreak}회
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 space-y-2">
                <p className="text-sm font-semibold text-emerald-300">최종 채택 4개</p>
                <div className="flex flex-wrap gap-2">
                  {finalNumberPlan.finalNumbers.map((n) => (
                    <span
                      key={`final-${n}`}
                      className="px-2 py-1 rounded-md text-xs font-semibold bg-emerald-400/30 text-emerald-200"
                    >
                      {n}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-emerald-100/90">
                  저장·스냅샷 기준 채택 번호는 전체 기간 평균근접 4개와 동일합니다.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
