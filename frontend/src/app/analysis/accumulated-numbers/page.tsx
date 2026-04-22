'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';

type WinningNumberRow = {
  draw_no: number;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus_num: number;
};

const EMPTY_COUNTS = Array.from({ length: 45 }, () => 0);

const isWinningNumberRow = (value: unknown): value is WinningNumberRow => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<WinningNumberRow>;
  return (
    typeof candidate.draw_no === 'number' &&
    typeof candidate.num1 === 'number' &&
    typeof candidate.num2 === 'number' &&
    typeof candidate.num3 === 'number' &&
    typeof candidate.num4 === 'number' &&
    typeof candidate.num5 === 'number' &&
    typeof candidate.num6 === 'number' &&
    typeof candidate.bonus_num === 'number'
  );
};

const buildNumberCounts = (rows: WinningNumberRow[]) => {
  const counts = [...EMPTY_COUNTS];
  for (const row of rows) {
    const winningNumbers = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6];
    for (const num of winningNumbers) {
      if (num >= 1 && num <= 45) {
        counts[num - 1] += 1;
      }
    }
  }
  return counts;
};

export default function AccumulatedNumbersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<string>('');
  const [searchedDraw, setSearchedDraw] = useState<string>('');
  const [isLoadingDraws, setIsLoadingDraws] = useState(true);
  const [drawLoadError, setDrawLoadError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [numberCounts, setNumberCounts] = useState<number[]>([...EMPTY_COUNTS]);
  const [analyzedDrawCount, setAnalyzedDrawCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadDrawNumbers = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/api/analysis/accumulated-numbers/draw-numbers`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch draw numbers: ${response.status}`);
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Draw numbers response is not an array');
        }

        const draws = data.filter((item): item is number => typeof item === 'number');
        if (!isMounted) return;

        setAvailableDraws(draws);
        setSelectedDraw((prev) => (prev || draws.length === 0 ? prev : String(draws[0])));
      } catch (error) {
        if (abortController.signal.aborted || !isMounted) {
          return;
        }

        console.error('Error fetching draw numbers:', error);
        setAvailableDraws([]);
        setSelectedDraw('');
        setDrawLoadError('회차 정보를 불러오지 못했습니다.');
      } finally {
        if (isMounted) {
          setIsLoadingDraws(false);
        }
      }
    };

    void loadDrawNumbers();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = async () => {
    if (!selectedDraw) {
      return;
    }

    const selectedDrawNo = Number(selectedDraw);
    if (!Number.isInteger(selectedDrawNo) || selectedDrawNo < 1) {
      setSearchError('유효한 회차를 선택해 주세요.');
      setSearchedDraw('');
      setNumberCounts([...EMPTY_COUNTS]);
      setAnalyzedDrawCount(0);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchedDraw(selectedDraw);

    if (selectedDrawNo === 1) {
      setNumberCounts([...EMPTY_COUNTS]);
      setAnalyzedDrawCount(0);
      setIsSearching(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(
        `${apiUrl}/api/analysis/accumulated-numbers/winning-numbers-range?draw_no=${selectedDrawNo}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch winning numbers range: ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Winning numbers range response is not an array');
      }

      const rows = data.filter(isWinningNumberRow);
      setNumberCounts(buildNumberCounts(rows));
      setAnalyzedDrawCount(rows.length);
    } catch (error) {
      console.error('Error fetching winning numbers range:', error);
      setSearchError('누적 당첨번호 데이터를 불러오지 못했습니다.');
      setNumberCounts([...EMPTY_COUNTS]);
      setAnalyzedDrawCount(0);
    } finally {
      setIsSearching(false);
    }
  };

  const maxCount = Math.max(...numberCounts, 0);
  const hasSearched = searchedDraw !== '';
  const hasAnalysisData = analyzedDrawCount > 0;
  const totalCount = numberCounts.reduce((sum, count) => sum + count, 0);
  const averageCount = hasAnalysisData ? totalCount / numberCounts.length : 0;
  const averageRatio = maxCount > 0 ? (averageCount / maxCount) * 100 : 0;
  const clampedAverageRatio = Math.min(100, Math.max(0, averageRatio));
  const chartBarHeightPx = 250;
  const chartBottomLabelOffsetPx = 20;
  const averageLineBottomPx = chartBottomLabelOffsetPx + (clampedAverageRatio / 100) * chartBarHeightPx;
  const selectedSearchDrawNo = Number(searchedDraw);
  const chartRows = numberCounts.map((count, index) => ({
    number: index + 1,
    count,
    ratio: maxCount > 0 ? (count / maxCount) * 100 : 0,
  }));
  const statusMessage = isLoadingDraws
    ? '회차 정보를 불러오는 중입니다.'
    : drawLoadError
      ? `${drawLoadError} 잠시 후 다시 시도해 주세요.`
      : availableDraws.length === 0
        ? '조회 가능한 회차 정보가 없습니다.'
        : isSearching
          ? `${selectedDraw}회 기준 누적 당첨번호를 집계하고 있습니다.`
          : searchError
            ? `${searchError} 잠시 후 다시 시도해 주세요.`
            : searchedDraw
              ? null
              : '회차를 선택한 뒤 조회 버튼을 누르면 해당 회차 기준 분석을 시작합니다.';

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <label className="flex flex-col gap-2 text-sm text-slate-300 min-w-[180px]">
                <span className="font-medium">회차 선택</span>
                <select
                  value={selectedDraw}
                  onChange={(e) => setSelectedDraw(e.target.value)}
                  disabled={isLoadingDraws || availableDraws.length === 0}
                  className="bg-slate-900 border border-white/20 rounded-xl px-4 py-2.5 text-white font-semibold focus:border-primary outline-none transition-all cursor-pointer shadow-inner"
                >
                  {isLoadingDraws && <option value="">회차 정보를 불러오는 중...</option>}
                  {!isLoadingDraws && availableDraws.length === 0 && <option value="">조회 가능한 회차 없음</option>}
                  {availableDraws.map((drawNo) => (
                    <option key={drawNo} value={drawNo}>
                      {drawNo}회
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={handleSearch}
                disabled={!selectedDraw || isLoadingDraws || availableDraws.length === 0 || isSearching}
                className={`h-[44px] px-5 rounded-xl font-semibold text-sm transition-all ${
                  selectedDraw && !isLoadingDraws && availableDraws.length > 0 && !isSearching
                    ? 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:border-primary/60 cursor-pointer'
                    : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                }`}
              >
                조회
              </button>
            </div>

            {statusMessage && <p className="text-slate-300 text-sm leading-relaxed">{statusMessage}</p>}
          </section>

          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-6 space-y-4">
            <h3 className="text-xl font-semibold text-white">번호별 누적 출현 횟수</h3>
            {hasSearched && selectedSearchDrawNo <= 1 ? (
              <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
            ) : !hasSearched ? (
              <p className="text-sm text-slate-300">조회를 실행하면 번호별 누적 막대 차트가 표시됩니다.</p>
            ) : isSearching ? (
              <p className="text-sm text-slate-300">차트 데이터를 계산하는 중입니다...</p>
            ) : searchError ? (
              <p className="text-sm text-rose-300">{searchError}</p>
            ) : !hasAnalysisData ? (
              <p className="text-sm text-slate-300">
                저장된 당첨번호 기준으로 집계 가능한 이전 회차 데이터가 없습니다.
              </p>
            ) : (
              <>
                <p className="text-sm text-slate-300">
                  {searchedDraw}회 이전 {analyzedDrawCount}개 회차의 당첨번호(보너스 제외)를 집계했습니다.
                </p>
                <div className="overflow-x-auto pb-2">
                  <div className="relative w-max">
                    {hasAnalysisData && (
                      <div
                        className="pointer-events-none absolute inset-x-0"
                        style={{ bottom: `${averageLineBottomPx}px` }}
                      >
                        <div className="w-full border-t-[3px] border-rose-400/90" />
                        <span className="absolute -top-5 right-0 rounded bg-rose-500/20 px-2 py-0.5 text-[11px] font-medium text-rose-300">
                          평균 {averageCount.toFixed(1)}회
                        </span>
                      </div>
                    )}
                    <ul className="w-max flex items-end gap-1.5 h-[320px]">
                      {chartRows.map((item) => (
                        <li key={item.number} className="w-8 shrink-0 flex flex-col items-center gap-2">
                          <span className="text-[11px] text-slate-100 tabular-nums leading-none">{item.count}</span>
                          <div className="w-full h-[250px] rounded-md border border-white/10 bg-slate-900/70 flex items-end overflow-hidden">
                            <div
                              className="w-full bg-primary/80"
                              style={{ height: `${Math.max(item.ratio, item.count > 0 ? 2 : 0)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-300 font-medium leading-none">{item.number}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
