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

type ChiSquareResult = {
  number: number;
  observed: number;
  expected: number;
  deviation: number;
  chiSquare: number;
  isLowFreq: boolean;
  isHighFreq: boolean;
};

const CHI_SQUARE_THRESHOLD = 3.84;
const TOTAL_NUMBERS = 45;
const NUMBERS_PER_DRAW = 7;

const isWinningNumberRow = (value: unknown): value is WinningNumberRow => {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<WinningNumberRow>;
  return (
    typeof c.draw_no === 'number' &&
    typeof c.num1 === 'number' &&
    typeof c.num2 === 'number' &&
    typeof c.num3 === 'number' &&
    typeof c.num4 === 'number' &&
    typeof c.num5 === 'number' &&
    typeof c.num6 === 'number' &&
    typeof c.bonus_num === 'number'
  );
};

const buildChiSquareResults = (rows: WinningNumberRow[]): ChiSquareResult[] => {
  const n = rows.length;
  const expected = (n * NUMBERS_PER_DRAW) / TOTAL_NUMBERS;
  const counts = Array.from({ length: TOTAL_NUMBERS }, () => 0);

  for (const row of rows) {
    const nums = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6, row.bonus_num];
    for (const num of nums) {
      if (num >= 1 && num <= TOTAL_NUMBERS) {
        counts[num - 1] += 1;
      }
    }
  }

  return counts.map((observed, index) => {
    const deviation = observed - expected;
    const chiSquare = expected > 0 ? (deviation * deviation) / expected : 0;
    return {
      number: index + 1,
      observed,
      expected,
      deviation,
      chiSquare,
      isLowFreq: observed < expected && chiSquare >= CHI_SQUARE_THRESHOLD,
      isHighFreq: observed > expected && chiSquare >= CHI_SQUARE_THRESHOLD,
    };
  });
};

export default function ChiSquarePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<string>('');
  const [isLoadingDraws, setIsLoadingDraws] = useState(true);
  const [drawLoadError, setDrawLoadError] = useState<string | null>(null);

  const [selectedWinningNumber, setSelectedWinningNumber] = useState<WinningNumberRow | null>(null);
  const [isLoadingWinningNumber, setIsLoadingWinningNumber] = useState(false);
  const [winningNumberError, setWinningNumberError] = useState<string | null>(null);

  const [searchedDraw, setSearchedDraw] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [analyzedDrawCount, setAnalyzedDrawCount] = useState(0);
  const [chiSquareResults, setChiSquareResults] = useState<ChiSquareResult[]>([]);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadDrawNumbers = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/api/analysis/chi-square/draw-numbers`, {
          signal: abortController.signal,
        });
        if (!response.ok) throw new Error(`Failed to fetch draw numbers: ${response.status}`);
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error('Draw numbers response is not an array');
        const draws = data.filter((item): item is number => typeof item === 'number');
        if (!isMounted) return;
        setAvailableDraws(draws);
        setSelectedDraw((prev) => (prev || draws.length === 0 ? prev : String(draws[0])));
      } catch (error) {
        if (abortController.signal.aborted || !isMounted) return;
        console.error('Error fetching draw numbers:', error);
        setAvailableDraws([]);
        setSelectedDraw('');
        setDrawLoadError('회차 정보를 불러오지 못했습니다.');
      } finally {
        if (isMounted) setIsLoadingDraws(false);
      }
    };

    void loadDrawNumbers();
    return () => { isMounted = false; };
  }, []);

  const resetResults = () => {
    setAnalyzedDrawCount(0);
    setChiSquareResults([]);
    setSelectedWinningNumber(null);
    setWinningNumberError(null);
  };

  const handleSearch = async () => {
    if (!selectedDraw) return;
    const drawNo = Number(selectedDraw);
    if (!Number.isInteger(drawNo) || drawNo < 1) {
      setSearchError('유효한 회차를 선택해 주세요.');
      setSearchedDraw('');
      resetResults();
      return;
    }

    setIsSearching(true);
    setIsLoadingWinningNumber(true);
    setSearchError(null);
    setWinningNumberError(null);
    setSearchedDraw(selectedDraw);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

    try {
      if (drawNo === 1) {
        const res = await fetch(`${apiUrl}/api/analysis/chi-square/winning-number?draw_no=${drawNo}`);
        if (!res.ok) throw new Error(`Failed to fetch winning number: ${res.status}`);
        const data: unknown = await res.json();
        if (!isWinningNumberRow(data)) throw new Error('Winning number response is invalid');
        setSelectedWinningNumber(data);
        resetResults();
        setAnalyzedDrawCount(0);
        return;
      }

      const [winningNumberRes, rangeRes] = await Promise.all([
        fetch(`${apiUrl}/api/analysis/chi-square/winning-number?draw_no=${drawNo}`),
        fetch(`${apiUrl}/api/analysis/chi-square/winning-numbers-range?draw_no=${drawNo}`),
      ]);

      if (!winningNumberRes.ok) {
        if (winningNumberRes.status === 404) throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
        throw new Error(`Failed to fetch winning number: ${winningNumberRes.status}`);
      }
      if (!rangeRes.ok) throw new Error(`Failed to fetch winning numbers range: ${rangeRes.status}`);

      const winningData: unknown = await winningNumberRes.json();
      const rangeData: unknown = await rangeRes.json();

      if (!isWinningNumberRow(winningData)) throw new Error('Winning number response is invalid');
      if (!Array.isArray(rangeData)) throw new Error('Winning numbers range response is not an array');

      const rows = rangeData.filter(isWinningNumberRow);
      setSelectedWinningNumber(winningData);
      setAnalyzedDrawCount(rows.length);
      setChiSquareResults(buildChiSquareResults(rows));
    } catch (error) {
      console.error('Error fetching chi-square data:', error);
      setSearchError('조회 데이터를 불러오지 못했습니다.');
      resetResults();
      setSearchedDraw('');
    } finally {
      setIsSearching(false);
      setIsLoadingWinningNumber(false);
    }
  };

  const hasSearched = searchedDraw !== '';
  const searchedDrawNo = Number(searchedDraw);
  const noHistory = hasSearched && searchedDrawNo <= 1;

  const selectedMainNumbers = selectedWinningNumber
    ? [
        selectedWinningNumber.num1,
        selectedWinningNumber.num2,
        selectedWinningNumber.num3,
        selectedWinningNumber.num4,
        selectedWinningNumber.num5,
        selectedWinningNumber.num6,
      ]
    : [];

  const expected = analyzedDrawCount > 0 ? (analyzedDrawCount * NUMBERS_PER_DRAW) / TOTAL_NUMBERS : 0;
  const lowFreqNumbers = chiSquareResults.filter((r) => r.isLowFreq);
  const highFreqNumbers = chiSquareResults.filter((r) => r.isHighFreq);

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

  const CHART_HALF_H = 110;
  const maxAbsDeviation = chiSquareResults.length > 0
    ? Math.max(...chiSquareResults.map((r) => Math.abs(r.deviation)), 1)
    : 1;

  const positiveDeviations = chiSquareResults.filter((r) => r.deviation > 0).map((r) => r.deviation);
  const top5PctThreshold = (() => {
    if (positiveDeviations.length === 0) return 0;
    const sorted = [...positiveDeviations].sort((a, b) => a - b);
    const idx = Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1);
    return sorted[idx];
  })();
  const avgLinePx = Math.round(CHART_HALF_H - (top5PctThreshold / maxAbsDeviation) * CHART_HALF_H);

  const excludedNumbers = top5PctThreshold > 0
    ? chiSquareResults.filter((r) => r.deviation >= top5PctThreshold)
    : [];

  const statusMessage = isLoadingDraws
    ? '회차 정보를 불러오는 중입니다.'
    : drawLoadError
      ? `${drawLoadError} 잠시 후 다시 시도해 주세요.`
      : availableDraws.length === 0
        ? '조회 가능한 회차 정보가 없습니다.'
        : isSearching
          ? `${selectedDraw}회 기준 카이제곱 검정을 계산하고 있습니다.`
          : searchError
            ? `${searchError} 잠시 후 다시 시도해 주세요.`
            : hasSearched
              ? null
              : '회차를 선택한 뒤 조회 버튼을 누르면 카이제곱 검정 결과를 표시합니다.';

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">

          {/* 회차 선택 컨트롤 */}
          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
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

              {/* 선택 회차 당첨번호 */}
              <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 min-h-[74px] lg:min-w-[440px]">
                <p className="text-xs font-medium text-slate-300 mb-2">선택 회차 당첨번호 (보너스 포함)</p>
                {isLoadingWinningNumber ? (
                  <p className="text-sm text-slate-300">당첨번호를 불러오는 중입니다...</p>
                ) : winningNumberError ? (
                  <p className="text-sm text-rose-300">{winningNumberError}</p>
                ) : selectedWinningNumber ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedMainNumbers.map((num, index) => (
                      <span
                        key={`${selectedWinningNumber.draw_no}-main-${index}`}
                        className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-primary/25 px-2 text-sm font-semibold text-primary"
                      >
                        {num}
                      </span>
                    ))}
                    <span className="text-sm text-slate-400 px-1">+</span>
                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-amber-400/25 px-2 text-sm font-semibold text-amber-300">
                      {selectedWinningNumber.bonus_num}
                    </span>
                    <span className="text-xs text-amber-300 font-medium">보너스</span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-300">회차를 선택한 뒤 조회 버튼을 누르면 당첨번호가 표시됩니다.</p>
                )}
              </div>
            </div>

            {statusMessage && <p className="text-slate-300 text-sm leading-relaxed">{statusMessage}</p>}
          </section>

          {/* 요약 카드 */}
          {hasSearched && !noHistory && !isSearching && !searchError && chiSquareResults.length > 0 && (
            <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: '분석 회차 수 (N)', value: `${analyzedDrawCount}회` },
                { label: '기대 출현 횟수 (E)', value: expected.toFixed(2) },
                { label: '유의 임계값 (χ²)', value: CHI_SQUARE_THRESHOLD.toFixed(2) },
                { label: '+편차 상위5% 임계값', value: top5PctThreshold > 0 ? `+${top5PctThreshold.toFixed(2)}` : '-' },
                { label: '제외 번호 (상위5%)', value: `${excludedNumbers.length}개` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 flex flex-col gap-1">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xl font-bold text-white">{value}</span>
                </div>
              ))}
            </section>
          )}

          {/* 편차 차트 */}
          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-semibold text-white">번호별 편차 차트 (O − E)</h3>
              {hasSearched && !noHistory && chiSquareResults.length > 0 && (
                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-amber-400/50 border border-amber-400/70" />
                    선택 회차 당첨번호
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-orange-500/70 border border-orange-500/90" />
                    제외 번호 (상위 5%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-blue-500/60 border border-blue-500/80" />
                    + 편차 (많이 나옴)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-rose-500/60 border border-rose-500/80" />
                    − 편차 (적게 나옴)
                  </span>
                </div>
              )}
            </div>
            {noHistory ? (
              <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
            ) : !hasSearched ? (
              <p className="text-sm text-slate-300">조회를 실행하면 번호별 편차 차트가 표시됩니다.</p>
            ) : isSearching ? (
              <p className="text-sm text-slate-300">차트 데이터를 계산하는 중입니다...</p>
            ) : searchError ? (
              <p className="text-sm text-rose-300">{searchError}</p>
            ) : chiSquareResults.length === 0 ? (
              <p className="text-sm text-slate-300">집계할 이전 회차 데이터가 없습니다.</p>
            ) : (
              <div className="overflow-x-auto pb-0.5">
                <div className="relative w-max">
                  {top5PctThreshold > 0 && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10"
                      style={{ top: avgLinePx }}
                    >
                      <div className="w-full border-t-2 border-dashed border-emerald-400/80" />
                      <span className="absolute -top-5 right-0 rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-300 whitespace-nowrap">
                        +편차 상위5% +{top5PctThreshold.toFixed(2)}
                      </span>
                    </div>
                  )}
                <ul className="w-max flex gap-1">
                  {chiSquareResults.map((item) => {
                    const isWinningNum = selectedWinningNumberSet?.has(item.number) ?? false;
                    const posBarPx = item.deviation > 0
                      ? Math.max((item.deviation / maxAbsDeviation) * CHART_HALF_H, 2)
                      : 0;
                    const negBarPx = item.deviation < 0
                      ? Math.max((Math.abs(item.deviation) / maxAbsDeviation) * CHART_HALF_H, 2)
                      : 0;

                    const isExcluded = top5PctThreshold > 0 && item.deviation >= top5PctThreshold;
                    const posColor = isWinningNum ? 'bg-amber-400/90' : isExcluded ? 'bg-orange-500/90' : item.isHighFreq ? 'bg-blue-500/90' : 'bg-blue-400/50';
                    const negColor = isWinningNum ? 'bg-amber-400/90' : item.isLowFreq ? 'bg-rose-500/90' : 'bg-rose-400/50';
                    const numColor = isWinningNum ? 'text-amber-300 font-bold' : isExcluded ? 'text-orange-300 font-bold' : 'text-slate-300 font-medium';

                    return (
                      <li key={item.number} className="w-8 shrink-0 flex flex-col items-center">
                        {/* 양수(+) 영역 */}
                        <div className="relative w-full flex flex-col justify-end" style={{ height: CHART_HALF_H }}>
                          {item.deviation > 0 && (
                            <>
                              <span className="absolute bottom-full left-0 right-0 text-center text-[10px] text-slate-200 tabular-nums leading-none mb-0.5">
                                +{item.deviation.toFixed(1)}
                              </span>
                              <div
                                className={`w-full rounded-t-sm ${posColor}`}
                                style={{ height: posBarPx }}
                              />
                            </>
                          )}
                        </div>

                        {/* 0 기준선 */}
                        <div className={`w-full h-[2px] ${isWinningNum ? 'bg-amber-400/60' : 'bg-white/20'}`} />

                        {/* 음수(-) 영역 */}
                        <div className="relative w-full flex flex-col justify-start" style={{ height: CHART_HALF_H }}>
                          {item.deviation < 0 && (
                            <>
                              <div
                                className={`w-full rounded-b-sm ${negColor}`}
                                style={{ height: negBarPx }}
                              />
                              <span className="absolute top-full left-0 right-0 text-center text-[10px] text-slate-200 tabular-nums leading-none mt-0.5">
                                {item.deviation.toFixed(1)}
                              </span>
                            </>
                          )}
                        </div>

                        {/* 번호 레이블 */}
                        <span className={`text-[11px] leading-none mt-4 ${numColor}`}>{item.number}</span>
                      </li>
                    );
                  })}
                </ul>
                </div>
              </div>
            )}
          </section>

          {/* 저빈도 / 고빈도 / 제외 번호 요약 */}
          {hasSearched && !noHistory && !isSearching && !searchError && chiSquareResults.length > 0 && (
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-2">
                <h4 className="text-sm font-semibold text-rose-300">저빈도 판정 번호 ({lowFreqNumbers.length}개)</h4>
                {lowFreqNumbers.length === 0 ? (
                  <p className="text-xs text-slate-400">유의미한 저빈도 번호가 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {lowFreqNumbers.map((r) => (
                      <span
                        key={r.number}
                        className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-rose-500/25 px-2 text-sm font-bold text-rose-200"
                      >
                        {r.number}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-2">
                <h4 className="text-sm font-semibold text-blue-300">고빈도 판정 번호 ({highFreqNumbers.length}개)</h4>
                {highFreqNumbers.length === 0 ? (
                  <p className="text-xs text-slate-400">유의미한 고빈도 번호가 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {highFreqNumbers.map((r) => (
                      <span
                        key={r.number}
                        className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-blue-500/25 px-2 text-sm font-bold text-blue-200"
                      >
                        {r.number}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4 space-y-2">
                <h4 className="text-sm font-semibold text-orange-300">제외 번호 — 상위 5% ({excludedNumbers.length}개)</h4>
                <p className="text-[11px] text-slate-500 leading-snug">편차 상위 5% 이상으로 과출현한 번호입니다.</p>
                {excludedNumbers.length === 0 ? (
                  <p className="text-xs text-slate-400">해당 번호가 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {excludedNumbers.map((r) => (
                      <span
                        key={r.number}
                        className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-orange-500/25 px-2 text-sm font-bold text-orange-200"
                      >
                        {r.number}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 번호별 결과 테이블 */}
          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
            <h3 className="text-xl font-semibold text-white">번호별 카이제곱 검정 결과</h3>

            {noHistory ? (
              <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
            ) : !hasSearched ? (
              <p className="text-sm text-slate-300">조회를 실행하면 번호별 카이제곱 검정 결과 테이블이 표시됩니다.</p>
            ) : isSearching ? (
              <p className="text-sm text-slate-300">데이터를 계산하는 중입니다...</p>
            ) : searchError ? (
              <p className="text-sm text-rose-300">{searchError}</p>
            ) : chiSquareResults.length === 0 ? (
              <p className="text-sm text-slate-300">집계할 이전 회차 데이터가 없습니다.</p>
            ) : (
              <>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 space-y-2 mb-1">
                  <p className="text-xs font-semibold text-slate-300">판정 기준값</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-400">
                    <span>
                      기대값 <span className="font-semibold text-white">E = {expected.toFixed(2)}</span>
                      <span className="text-slate-500 ml-1">({analyzedDrawCount}회 × 7 / 45)</span>
                    </span>
                    <span>
                      유의 임계값 <span className="font-semibold text-amber-300">χ² ≥ {CHI_SQUARE_THRESHOLD}</span>
                      <span className="text-slate-500 ml-1">(p &lt; 0.05, df=1)</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1 border-t border-white/5">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 rounded bg-rose-500/40 border border-rose-500/60" />
                      저빈도: O &lt; {expected.toFixed(2)} AND χ² ≥ {CHI_SQUARE_THRESHOLD}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 rounded bg-blue-500/40 border border-blue-500/60" />
                      고빈도: O &gt; {expected.toFixed(2)} AND χ² ≥ {CHI_SQUARE_THRESHOLD}
                    </span>
                    {selectedWinningNumberSet && (
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded bg-amber-400/40 border border-amber-400/60" />
                        선택 회차 당첨번호
                      </span>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[560px]">
                    <thead>
                      <tr className="border-b border-white/10 text-xs text-slate-400">
                        <th className="py-2 pr-3 font-medium w-12">번호</th>
                        <th className="py-2 pr-3 font-medium text-right">실제(O)</th>
                        <th className="py-2 pr-3 font-medium text-right">기대(E)</th>
                        <th className="py-2 pr-3 font-medium text-right">편차(O-E)</th>
                        <th className="py-2 pr-3 font-medium text-right">χ² 기여값</th>
                        <th className="py-2 font-medium text-center">판정</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chiSquareResults.map((row) => {
                        const isRowExcluded = top5PctThreshold > 0 && row.deviation >= top5PctThreshold;
                        return (
                          <tr
                            key={row.number}
                            className={`border-b border-white/5 transition-colors ${
                              isRowExcluded
                                ? 'bg-orange-500/10 hover:bg-orange-500/15'
                                : row.isLowFreq
                                  ? 'bg-rose-500/10 hover:bg-rose-500/15'
                                  : row.isHighFreq
                                    ? 'bg-blue-500/10 hover:bg-blue-500/15'
                                    : 'hover:bg-white/3'
                            }`}
                          >
                            <td className="py-2 pr-3">
                              <span
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                  isRowExcluded
                                    ? 'bg-orange-500/30 text-orange-200'
                                    : row.isLowFreq
                                      ? 'bg-rose-500/30 text-rose-200'
                                      : row.isHighFreq
                                        ? 'bg-blue-500/30 text-blue-200'
                                        : 'bg-white/10 text-white'
                                }`}
                              >
                                {row.number}
                              </span>
                            </td>
                            <td className="py-2 pr-3 text-right tabular-nums text-white font-medium">{row.observed}</td>
                            <td className="py-2 pr-3 text-right tabular-nums text-slate-400">{row.expected.toFixed(2)}</td>
                            <td className={`py-2 pr-3 text-right tabular-nums font-medium ${row.deviation < 0 ? 'text-rose-300' : row.deviation > 0 ? 'text-blue-300' : 'text-slate-400'}`}>
                              {row.deviation > 0 ? '+' : ''}{row.deviation.toFixed(2)}
                            </td>
                            <td className="py-2 pr-3 text-right tabular-nums text-slate-300">{row.chiSquare.toFixed(4)}</td>
                            <td className="py-2 text-center">
                              {isRowExcluded ? (
                                <span className="text-xs font-semibold text-orange-300 bg-orange-500/20 rounded-md px-2 py-0.5">제외</span>
                              ) : row.isLowFreq ? (
                                <span className="text-xs font-semibold text-rose-300 bg-rose-500/20 rounded-md px-2 py-0.5">저빈도</span>
                              ) : row.isHighFreq ? (
                                <span className="text-xs font-semibold text-blue-300 bg-blue-500/20 rounded-md px-2 py-0.5">고빈도</span>
                              ) : (
                                <span className="text-xs text-slate-500">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          {/* 통계적 주의사항 */}
          <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">통계적 주의사항:</span>{' '}
              카이제곱 검정(χ², df=1, α=0.05, 임계값 3.84)은 각 번호의 출현 편차가 우연으로 설명되지 않을 가능성을 나타냅니다.
              그러나 로또는 매 회 독립 시행이므로 이전 회차의 결과가 이후 회차에 영향을 주지 않습니다.
              저빈도/고빈도 판정은 통계적 참고 지표로만 활용하세요.
            </p>
          </section>

        </main>
      </div>
    </div>
  );
}
