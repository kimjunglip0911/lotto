'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { SearchControls } from './components/SearchControls';
import { StreakChart } from './components/StreakChart';
import { StreakTable } from './components/StreakTable';
import { SummaryCards } from './components/SummaryCards';
import { useAbsenceStreakData } from './hooks/useAbsenceStreakData';

export default function AbsenceStreakPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {
    availableDraws,
    selectedDraw,
    setSelectedDraw,
    isLoadingDraws,
    drawLoadError,
    selectedWinningNumber,
    isLoadingWinningNumber,
    winningNumberError,
    searchedDraw,
    isSearching,
    searchError,
    analyzedDrawCount,
    streakResults,
    averageStreak,
    top5PctThreshold,
    handleSearch,
  } = useAbsenceStreakData();

  const hasSearched = searchedDraw !== '';
  const searchedDrawNo = Number(searchedDraw);
  const noHistory = hasSearched && searchedDrawNo <= 1;

  const selectedWinningNumberSet = selectedWinningNumber
    ? new Set([
        selectedWinningNumber.num1,
        selectedWinningNumber.num2,
        selectedWinningNumber.num3,
        selectedWinningNumber.num4,
        selectedWinningNumber.num5,
        selectedWinningNumber.num6,
        selectedWinningNumber.bonus_num,
      ])
    : null;

  const maxStreak = streakResults.length > 0 ? Math.max(...streakResults.map((r) => r.streak)) : 0;
  const coldNumbers = streakResults.filter((r) => r.isCold);

  const statusMessage = isLoadingDraws
    ? '회차 정보를 불러오는 중입니다.'
    : drawLoadError
      ? `${drawLoadError} 잠시 후 다시 시도해 주세요.`
      : availableDraws.length === 0
        ? '조회 가능한 회차 정보가 없습니다.'
        : isSearching
          ? `${selectedDraw}회 기준 연속 미출현 기간을 계산하고 있습니다.`
          : searchError
            ? `${searchError} 잠시 후 다시 시도해 주세요.`
            : hasSearched
              ? null
              : '회차를 선택한 뒤 조회 버튼을 누르면 연속 미출현 분석 결과를 표시합니다.';

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
          <SearchControls
            availableDraws={availableDraws}
            selectedDraw={selectedDraw}
            onSelectedDrawChange={setSelectedDraw}
            isLoadingDraws={isLoadingDraws}
            isSearching={isSearching}
            handleSearch={() => void handleSearch()}
            isLoadingWinningNumber={isLoadingWinningNumber}
            winningNumberError={winningNumberError}
            selectedWinningNumber={selectedWinningNumber}
            statusMessage={statusMessage}
          />

          {/* 요약 카드 */}
          {hasSearched && !noHistory && !isSearching && !searchError && streakResults.length > 0 && (
            <SummaryCards
              analyzedDrawCount={analyzedDrawCount}
              maxStreak={maxStreak}
              averageStreak={averageStreak}
              top5PctThreshold={top5PctThreshold}
              coldNumbersCount={coldNumbers.length}
            />
          )}

          <StreakChart
            hasSearched={hasSearched}
            noHistory={noHistory}
            isSearching={isSearching}
            searchError={searchError}
            streakResults={streakResults}
            top5PctThreshold={top5PctThreshold}
            selectedWinningNumberSet={selectedWinningNumberSet}
          />

          {/* 저빈도 후보 요약 */}
          {hasSearched && !noHistory && !isSearching && !searchError && streakResults.length > 0 && (
            <section className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4 space-y-2">
              <h4 className="text-sm font-semibold text-orange-300">저빈도 후보 — 평균 미출현 기간 초과 ({coldNumbers.length}개)</h4>
              <p className="text-[11px] text-slate-500 leading-snug">
                선택 회차 기준 평균({averageStreak.toFixed(1)}회차)을 초과하여 연속으로 출현하지 않은 번호입니다.
              </p>
              {coldNumbers.length === 0 ? (
                <p className="text-xs text-slate-400">해당 번호가 없습니다.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {coldNumbers
                    .slice()
                    .sort((a, b) => b.streak - a.streak)
                    .map((r) => (
                      <span
                        key={r.number}
                        className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-orange-500/25 px-2 text-sm font-bold text-orange-200"
                        title={`${r.streak}회차 미출현`}
                      >
                        {r.number}
                      </span>
                    ))}
                </div>
              )}
            </section>
          )}

          <StreakTable
            hasSearched={hasSearched}
            noHistory={noHistory}
            isSearching={isSearching}
            searchError={searchError}
            streakResults={streakResults}
          />

          {/* 통계적 주의사항 */}
          <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">통계적 주의사항:</span>{' '}
              연속 미출현 기간(Absence Streak)은 각 번호가 마지막으로 당첨된 이후 몇 회차가 경과했는지를 나타내는 지표입니다.
              그러나 로또는 매 회차가 독립 시행이므로 과거의 미출현이 미래 출현 확률에 영향을 주지 않습니다.
              (도박사의 오류) 저빈도 후보 판정은 통계적 참고 지표로만 활용하시기 바랍니다.
            </p>
          </section>

        </main>
      </div>
    </div>
  );
}
