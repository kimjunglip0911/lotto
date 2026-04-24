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

// 4국면: 상승지속 / 하락전환 / 회복중 / 하락지속
type TrendPhase = 'up_cont' | 'topping' | 'recovering' | 'down_cont';

type NumberTrendResult = {
  number: number;
  emaFast: number;
  emaSlow: number;
  phase: TrendPhase;
};

// 고정 k EMA 설정
const K_CONFIG = { fast: 0.05, slow: 0.02 } as const;

// 기댓값: 주번호 6개 / 45개 번호 (보너스 제외)
const BASELINE = 6 / 45;

const TOTAL_NUMBERS = 45;

const PHASE_META: Record<TrendPhase, { label: string; color: string; bgClass: string; borderClass: string; textClass: string; badgeClass: string }> = {
  up_cont:    { label: '상승지속',  color: '#4ade80', bgClass: 'bg-emerald-500/8',  borderClass: 'border-emerald-500/30', textClass: 'text-emerald-300', badgeClass: 'bg-emerald-500/25 text-emerald-200' },
  topping:    { label: '하락전환',  color: '#c084fc', bgClass: 'bg-violet-500/8',   borderClass: 'border-violet-500/30',  textClass: 'text-violet-300',  badgeClass: 'bg-violet-500/25 text-violet-200'  },
  recovering: { label: '회복중',    color: '#38bdf8', bgClass: 'bg-sky-500/8',      borderClass: 'border-sky-500/30',     textClass: 'text-sky-300',     badgeClass: 'bg-sky-500/25 text-sky-200'        },
  down_cont:  { label: '하락지속',  color: '#f87171', bgClass: 'bg-rose-500/8',     borderClass: 'border-rose-500/30',    textClass: 'text-rose-300',    badgeClass: 'bg-rose-500/25 text-rose-200'      },
};

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

// 전체 이력을 순회하며 고정 k EMA 계산
const buildFixedKEma = (rows: WinningNumberRow[], num: number, k: number): number => {
  if (rows.length === 0) return 0;
  let ema = 0;
  for (const row of rows) {
    const nums = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6, row.bonus_num];
    const signal = nums.includes(num) ? 1 : 0;
    ema = signal * k + ema * (1 - k);
  }
  return ema;
};

// fast/slow EMA와 baseline으로 4국면 판정
const classifyPhase = (emaFast: number, emaSlow: number): TrendPhase => {
  const shortTermUp = emaFast > emaSlow;
  const longTermUp = emaSlow > BASELINE;
  if (shortTermUp && longTermUp) return 'up_cont';
  if (!shortTermUp && longTermUp) return 'topping';
  if (shortTermUp && !longTermUp) return 'recovering';
  return 'down_cont';
};

const buildTrendResults = (allRows: WinningNumberRow[]): NumberTrendResult[] => {
  return Array.from({ length: TOTAL_NUMBERS }, (_, i) => {
    const number = i + 1;
    const emaFast = buildFixedKEma(allRows, number, K_CONFIG.fast);
    const emaSlow = buildFixedKEma(allRows, number, K_CONFIG.slow);
    const phase = classifyPhase(emaFast, emaSlow);
    return { number, emaFast, emaSlow, phase };
  });
};

const CHART_W_PER_NUM = 36;
const CHART_H = 200;
const CHART_PADDING_TOP = 16;
const CHART_PADDING_BOTTOM = 24;
const CHART_INNER_H = CHART_H - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

const rateToY = (rate: number, maxRate: number): number => {
  if (maxRate <= 0) return CHART_PADDING_TOP + CHART_INNER_H;
  const ratio = Math.min(rate / maxRate, 1);
  return CHART_PADDING_TOP + CHART_INNER_H * (1 - ratio);
};

export default function TrendPage() {
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

  const [trendResults, setTrendResults] = useState<NumberTrendResult[]>([]);
  const [historyCount, setHistoryCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadDrawNumbers = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/api/analysis/trend/draw-numbers`, {
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
    setTrendResults([]);
    setHistoryCount(0);
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
        const res = await fetch(`${apiUrl}/api/analysis/trend/winning-number?draw_no=${drawNo}`);
        if (!res.ok) throw new Error(`Failed to fetch winning number: ${res.status}`);
        const data: unknown = await res.json();
        if (!isWinningNumberRow(data)) throw new Error('Winning number response is invalid');
        setSelectedWinningNumber(data);
        resetResults();
        return;
      }

      const [winningNumberRes, allHistoryRes] = await Promise.all([
        fetch(`${apiUrl}/api/analysis/trend/winning-number?draw_no=${drawNo}`),
        fetch(`${apiUrl}/api/analysis/trend/all-history?draw_no=${drawNo}`),
      ]);

      if (!winningNumberRes.ok) {
        if (winningNumberRes.status === 404) throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
        throw new Error(`Failed to fetch winning number: ${winningNumberRes.status}`);
      }
      if (!allHistoryRes.ok) {
        throw new Error(`Failed to fetch all history: ${allHistoryRes.status}`);
      }

      const winningData: unknown = await winningNumberRes.json();
      if (!isWinningNumberRow(winningData)) throw new Error('Winning number response is invalid');

      const historyData: unknown = await allHistoryRes.json();
      if (!Array.isArray(historyData)) throw new Error('All history response is not an array');
      const allRows = historyData.filter(isWinningNumberRow);

      setSelectedWinningNumber(winningData);
      setHistoryCount(allRows.length);
      setTrendResults(buildTrendResults(allRows));
    } catch (error) {
      console.error('Error fetching trend data:', error);
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
  const hasResults = trendResults.length > 0;

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

  // 국면별 번호 분류
  const phaseGroups: Record<TrendPhase, NumberTrendResult[]> = {
    up_cont: trendResults.filter((r) => r.phase === 'up_cont'),
    topping: trendResults.filter((r) => r.phase === 'topping'),
    recovering: trendResults.filter((r) => r.phase === 'recovering'),
    down_cont: trendResults.filter((r) => r.phase === 'down_cont'),
  };

  // 차트 maxRate 계산
  const allEmaValues = trendResults.flatMap((r) => [r.emaFast, r.emaSlow]);
  const maxRate = allEmaValues.length > 0 ? Math.max(...allEmaValues, BASELINE * 1.5) : BASELINE * 2;

  const chartTotalW = TOTAL_NUMBERS * CHART_W_PER_NUM;
  const baselineY = rateToY(BASELINE, maxRate);

  const statusMessage = isLoadingDraws
    ? '회차 정보를 불러오는 중입니다.'
    : drawLoadError
      ? `${drawLoadError} 잠시 후 다시 시도해 주세요.`
      : availableDraws.length === 0
        ? '조회 가능한 회차 정보가 없습니다.'
        : isSearching
          ? `${selectedDraw}회 기준 추세 분석을 계산하고 있습니다.`
          : searchError
            ? `${searchError} 잠시 후 다시 시도해 주세요.`
            : hasSearched
              ? null
              : '회차를 선택한 뒤 조회 버튼을 누르면 추세 분석 결과를 표시합니다.';

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

          {/* 분석 회차 수 요약 */}
          {hasSearched && !noHistory && !isSearching && !searchError && hasResults && (
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">분석 회차 수</span>
                <span className="text-lg font-bold text-white">{historyCount}회</span>
                <span className="text-[10px] text-slate-500">전체 이력</span>
              </div>
              <div className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 flex flex-col gap-1">
                <span className="text-xs font-semibold text-emerald-400">Fast EMA</span>
                <span className="text-lg font-bold text-white">k = {K_CONFIG.fast}</span>
                <span className="text-[10px] text-slate-500">~90회 유효</span>
              </div>
              <div className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 flex flex-col gap-1">
                <span className="text-xs font-semibold text-sky-400">Slow EMA</span>
                <span className="text-lg font-bold text-white">k = {K_CONFIG.slow}</span>
                <span className="text-[10px] text-slate-500">~228회 유효</span>
              </div>
              <div className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">기댓값</span>
                <span className="text-lg font-bold text-white">{(BASELINE * 100).toFixed(1)}%</span>
                <span className="text-[10px] text-slate-500">6/45 (주번호 기준)</span>
              </div>
            </section>
          )}

          {/* EMA 꺾은선 차트 */}
          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-semibold text-white">번호별 지수이동평균(EMA) 출현율</h3>
              {hasResults && (
                <div className="flex flex-wrap gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="inline-block w-5 h-[2px] rounded" style={{ backgroundColor: '#4ade80' }} />
                    Fast EMA (k={K_CONFIG.fast})
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="inline-block w-5 h-[2px] rounded" style={{ backgroundColor: '#38bdf8' }} />
                    Slow EMA (k={K_CONFIG.slow})
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="inline-block w-5 h-[2px] rounded border-t-2 border-dashed border-emerald-400/80" />
                    기댓값
                  </span>
                </div>
              )}
            </div>

            {noHistory ? (
              <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
            ) : !hasSearched ? (
              <p className="text-sm text-slate-300">조회를 실행하면 번호별 지수이동평균(EMA) 꺾은선 차트가 표시됩니다.</p>
            ) : isSearching ? (
              <p className="text-sm text-slate-300">차트 데이터를 계산하는 중입니다...</p>
            ) : searchError ? (
              <p className="text-sm text-rose-300">{searchError}</p>
            ) : !hasResults ? (
              <p className="text-sm text-slate-300">집계할 이전 회차 데이터가 없습니다.</p>
            ) : (
              <div className="overflow-x-auto pb-1">
                <svg
                  width={chartTotalW}
                  height={CHART_H}
                  className="block"
                  style={{ minWidth: chartTotalW }}
                >
                  {/* 기댓값 기준선 */}
                  <line
                    x1={0} y1={baselineY}
                    x2={chartTotalW} y2={baselineY}
                    stroke="#34d399"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    opacity={0.7}
                  />
                  <text x={chartTotalW - 4} y={baselineY - 4} fill="#34d399" fontSize={10} textAnchor="end" opacity={0.9}>
                    기댓값 {(BASELINE * 100).toFixed(1)}%
                  </text>

                  {/* Slow EMA 꺾은선 */}
                  <polyline
                    points={trendResults.map((r, i) => {
                      const x = i * CHART_W_PER_NUM + CHART_W_PER_NUM / 2;
                      const y = rateToY(r.emaSlow, maxRate);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={1.5}
                    opacity={0.8}
                  />

                  {/* Fast EMA 꺾은선 */}
                  <polyline
                    points={trendResults.map((r, i) => {
                      const x = i * CHART_W_PER_NUM + CHART_W_PER_NUM / 2;
                      const y = rateToY(r.emaFast, maxRate);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth={1.5}
                    opacity={0.85}
                  />

                  {/* 당첨번호 수직선 */}
                  {selectedWinningNumberSet && trendResults.map((r, i) => {
                    if (!selectedWinningNumberSet.has(r.number)) return null;
                    const x = i * CHART_W_PER_NUM + CHART_W_PER_NUM / 2;
                    return (
                      <line
                        key={r.number}
                        x1={x} y1={CHART_PADDING_TOP}
                        x2={x} y2={CHART_H - CHART_PADDING_BOTTOM}
                        stroke="#fbbf24"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        opacity={0.5}
                      />
                    );
                  })}

                  {/* X축 번호 레이블 */}
                  {trendResults.map((r, i) => {
                    const x = i * CHART_W_PER_NUM + CHART_W_PER_NUM / 2;
                    const isWinning = selectedWinningNumberSet?.has(r.number) ?? false;
                    return (
                      <text
                        key={r.number}
                        x={x}
                        y={CHART_H - 4}
                        textAnchor="middle"
                        fontSize={10}
                        fill={isWinning ? '#fbbf24' : '#94a3b8'}
                        fontWeight={isWinning ? 700 : 400}
                      >
                        {r.number}
                      </text>
                    );
                  })}
                </svg>
              </div>
            )}
          </section>

          {/* 4국면 요약 카드 */}
          {hasSearched && !noHistory && !isSearching && !searchError && hasResults && (
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {(Object.entries(phaseGroups) as [TrendPhase, NumberTrendResult[]][]).map(([phase, numbers]) => {
                const meta = PHASE_META[phase];
                return (
                  <div key={phase} className={`rounded-2xl border ${meta.borderClass} ${meta.bgClass} p-4 space-y-2`}>
                    <h4 className={`text-sm font-semibold ${meta.textClass}`}>
                      {meta.label} ({numbers.length}개)
                    </h4>
                    {numbers.length === 0 ? (
                      <p className="text-xs text-slate-400">{meta.label} 번호가 없습니다.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {numbers.map((r) => (
                          <span
                            key={r.number}
                            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-bold ${meta.badgeClass}`}
                          >
                            {r.number}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* 번호별 EMA 상세 테이블 */}
          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
            <h3 className="text-xl font-semibold text-white">번호별 EMA 출현율 상세</h3>

            {noHistory ? (
              <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
            ) : !hasSearched ? (
              <p className="text-sm text-slate-300">조회를 실행하면 번호별 EMA 출현율 테이블이 표시됩니다.</p>
            ) : isSearching ? (
              <p className="text-sm text-slate-300">데이터를 계산하는 중입니다...</p>
            ) : searchError ? (
              <p className="text-sm text-rose-300">{searchError}</p>
            ) : !hasResults ? (
              <p className="text-sm text-slate-300">집계할 이전 회차 데이터가 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left" style={{ minWidth: 480 }}>
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-slate-400">
                      <th className="py-2 pr-3 font-medium w-12">번호</th>
                      <th className="py-2 pr-2 font-medium text-right" style={{ color: '#4ade80' }}>Fast EMA</th>
                      <th className="py-2 pr-2 font-medium text-right" style={{ color: '#38bdf8' }}>Slow EMA</th>
                      <th className="py-2 pr-2 font-medium text-right text-slate-400">기댓값 대비</th>
                      <th className="py-2 font-medium text-center">국면</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendResults.map((row) => {
                      const isWinning = selectedWinningNumberSet?.has(row.number) ?? false;
                      const meta = PHASE_META[row.phase];
                      const fastPct = (row.emaFast * 100).toFixed(1);
                      const slowPct = (row.emaSlow * 100).toFixed(1);
                      const diffPct = ((row.emaSlow - BASELINE) * 100).toFixed(1);
                      const diffPositive = row.emaSlow >= BASELINE;
                      return (
                        <tr
                          key={row.number}
                          className={`border-b border-white/5 transition-colors ${meta.bgClass} hover:brightness-110`}
                        >
                          <td className="py-1.5 pr-3">
                            <span
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                isWinning
                                  ? 'bg-amber-400/30 text-amber-200'
                                  : `${meta.badgeClass}`
                              }`}
                            >
                              {row.number}
                            </span>
                          </td>
                          <td className="py-1.5 pr-2 text-right tabular-nums text-xs text-emerald-300">{fastPct}%</td>
                          <td className="py-1.5 pr-2 text-right tabular-nums text-xs text-sky-300">{slowPct}%</td>
                          <td className={`py-1.5 pr-2 text-right tabular-nums text-xs ${diffPositive ? 'text-blue-300' : 'text-rose-400'}`}>
                            {diffPositive ? '+' : ''}{diffPct}%
                          </td>
                          <td className="py-1.5 text-center">
                            <span className={`text-xs font-semibold rounded-md px-2 py-0.5 ${meta.badgeClass}`}>
                              {meta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 통계적 주의사항 */}
          <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">분석 방식:</span>{' '}
              전체 회차 이력을 입력으로 사용하며, 최근 회차일수록 더 높은 가중치를 부여합니다 (지수 감쇠).
              Fast EMA(k={K_CONFIG.fast}, 유효범위 약 90회)가 Slow EMA(k={K_CONFIG.slow}, 유효범위 약 228회)를 웃돌고 Slow EMA가 기댓값({(BASELINE * 100).toFixed(1)}%) 이상이면 <span className="text-emerald-300">상승지속</span>,
              Fast EMA가 Slow EMA 아래이고 Slow EMA가 기댓값 이상이면 <span className="text-violet-300">하락전환</span>,
              Fast EMA가 Slow EMA 위이고 Slow EMA가 기댓값 미만이면 <span className="text-sky-300">회복중</span>,
              모두 기댓값 미만이면 <span className="text-rose-300">하락지속</span>으로 분류합니다.
              로또는 매 회 독립 시행이므로 과거 추세가 미래 결과를 보장하지 않습니다. 참고 지표로만 활용하세요.
            </p>
          </section>

        </main>
      </div>
    </div>
  );
}
