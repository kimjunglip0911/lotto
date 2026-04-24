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

type MaWindowData = {
  windowSize: number;
  label: string;
  color: string;
  rows: WinningNumberRow[];
};

type NumberTrendResult = {
  number: number;
  rates: Record<number, number>;
  trend: 'down' | 'up' | 'hold' | 'neutral';
};

const MA_WINDOWS = [
  { windowSize: 4,   label: 'MA4',   color: '#facc15' },
  { windowSize: 12,  label: 'MA12',  color: '#4ade80' },
  { windowSize: 24,  label: 'MA24',  color: '#38bdf8' },
  { windowSize: 52,  label: 'MA52',  color: '#60a5fa' },
  { windowSize: 156, label: 'MA156', color: '#fb923c' },
  { windowSize: 312, label: 'MA312', color: '#c084fc' },
  { windowSize: 520, label: 'MA520', color: '#94a3b8' },
] as const;

const TOTAL_NUMBERS = 45;
const EXPECTED_RATE = 7 / TOTAL_NUMBERS;

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

const buildCountsFromRows = (rows: WinningNumberRow[]): number[] => {
  const counts = Array.from({ length: TOTAL_NUMBERS }, () => 0);
  for (const row of rows) {
    const nums = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6, row.bonus_num];
    for (const num of nums) {
      if (num >= 1 && num <= TOTAL_NUMBERS) counts[num - 1] += 1;
    }
  }
  return counts;
};

const buildTrendResults = (windowDataList: MaWindowData[]): NumberTrendResult[] => {
  return Array.from({ length: TOTAL_NUMBERS }, (_, i) => {
    const number = i + 1;
    const rates: Record<number, number> = {};
    for (const wd of windowDataList) {
      if (wd.rows.length === 0) {
        rates[wd.windowSize] = 0;
        continue;
      }
      const counts = buildCountsFromRows(wd.rows);
      rates[wd.windowSize] = counts[i] / wd.rows.length;
    }

    const ma4 = rates[4] ?? 0;
    const ma12 = rates[12] ?? 0;
    const ma52 = rates[52] ?? 0;
    const trend: 'down' | 'up' | 'hold' | 'neutral' =
      ma4 === 0 && ma12 === 0
        ? 'hold'
        : ma4 >= ma52 || ma12 >= ma52
          ? 'up'
          : ma4 < ma52 && ma12 < ma52
            ? 'down'
            : 'neutral';

    return { number, rates, trend };
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

  const [windowDataList, setWindowDataList] = useState<MaWindowData[]>([]);
  const [trendResults, setTrendResults] = useState<NumberTrendResult[]>([]);
  const [windowDrawCounts, setWindowDrawCounts] = useState<Record<number, number>>({});

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
    setWindowDataList([]);
    setTrendResults([]);
    setWindowDrawCounts({});
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

      const [winningNumberRes, ...windowResponses] = await Promise.all([
        fetch(`${apiUrl}/api/analysis/trend/winning-number?draw_no=${drawNo}`),
        ...MA_WINDOWS.map((w) =>
          fetch(`${apiUrl}/api/analysis/trend/winning-numbers-window?draw_no=${drawNo}&window_size=${w.windowSize}`)
        ),
      ]);

      if (!winningNumberRes.ok) {
        if (winningNumberRes.status === 404) throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
        throw new Error(`Failed to fetch winning number: ${winningNumberRes.status}`);
      }

      const winningData: unknown = await winningNumberRes.json();
      if (!isWinningNumberRow(winningData)) throw new Error('Winning number response is invalid');

      const parsedWindowDataList: MaWindowData[] = [];
      const newWindowDrawCounts: Record<number, number> = {};

      for (let i = 0; i < MA_WINDOWS.length; i++) {
        const w = MA_WINDOWS[i];
        const res = windowResponses[i];
        if (!res.ok) throw new Error(`Failed to fetch window data for MA${w.windowSize}: ${res.status}`);
        const data: unknown = await res.json();
        if (!Array.isArray(data)) throw new Error(`Window data for MA${w.windowSize} is not an array`);
        const rows = data.filter(isWinningNumberRow);
        parsedWindowDataList.push({ windowSize: w.windowSize, label: w.label, color: w.color, rows });
        newWindowDrawCounts[w.windowSize] = rows.length;
      }

      setSelectedWinningNumber(winningData);
      setWindowDataList(parsedWindowDataList);
      setWindowDrawCounts(newWindowDrawCounts);
      setTrendResults(buildTrendResults(parsedWindowDataList));
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

  const downTrendNumbers = trendResults.filter((r) => r.trend === 'down');
  const upTrendNumbers = trendResults.filter((r) => r.trend === 'up');
  const holdNumbers = trendResults.filter((r) => r.trend === 'hold');

  const allRates = trendResults.flatMap((r) => Object.values(r.rates));
  const maxRate = allRates.length > 0 ? Math.max(...allRates, EXPECTED_RATE * 1.5) : EXPECTED_RATE * 2;

  const chartTotalW = TOTAL_NUMBERS * CHART_W_PER_NUM;
  const expectedY = rateToY(EXPECTED_RATE, maxRate);

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

          {/* 요약 카드: MA 기간별 실제 분석 회차 수 */}
          {hasSearched && !noHistory && !isSearching && !searchError && hasResults && (
            <section className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {MA_WINDOWS.map((w) => (
                <div key={w.windowSize} className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 flex flex-col gap-1">
                  <span className="text-xs font-semibold" style={{ color: w.color }}>{w.label}</span>
                  <span className="text-lg font-bold text-white">{windowDrawCounts[w.windowSize] ?? 0}회</span>
                  <span className="text-[10px] text-slate-500">분석 회차</span>
                </div>
              ))}
            </section>
          )}

          {/* 이동평균 꺾은선 차트 */}
          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-semibold text-white">번호별 이동평균 출현율</h3>
              {hasResults && (
                <div className="flex flex-wrap gap-3">
                  {MA_WINDOWS.map((w) => (
                    <span key={w.windowSize} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="inline-block w-5 h-[2px] rounded" style={{ backgroundColor: w.color }} />
                      {w.label}
                    </span>
                  ))}
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
              <p className="text-sm text-slate-300">조회를 실행하면 번호별 이동평균 꺾은선 차트가 표시됩니다.</p>
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
                    x1={0} y1={expectedY}
                    x2={chartTotalW} y2={expectedY}
                    stroke="#34d399"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    opacity={0.7}
                  />
                  <text x={chartTotalW - 4} y={expectedY - 4} fill="#34d399" fontSize={10} textAnchor="end" opacity={0.9}>
                    기댓값 {(EXPECTED_RATE * 100).toFixed(1)}%
                  </text>

                  {/* MA 꺾은선 */}
                  {MA_WINDOWS.map((w) => {
                    const points = trendResults
                      .map((r, i) => {
                        const x = i * CHART_W_PER_NUM + CHART_W_PER_NUM / 2;
                        const y = rateToY(r.rates[w.windowSize] ?? 0, maxRate);
                        return `${x},${y}`;
                      })
                      .join(' ');
                    return (
                      <polyline
                        key={w.windowSize}
                        points={points}
                        fill="none"
                        stroke={w.color}
                        strokeWidth={1.5}
                        opacity={0.85}
                      />
                    );
                  })}

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

          {/* 감소 추세 / 증가 추세 / 보류 번호 요약 */}
          {hasSearched && !noHistory && !isSearching && !searchError && hasResults && (
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-2">
                <h4 className="text-sm font-semibold text-rose-300">
                  감소 추세 번호 ({downTrendNumbers.length}개)
                  <span className="ml-2 text-xs font-normal text-slate-400">MA12 &lt; MA52</span>
                </h4>
                {downTrendNumbers.length === 0 ? (
                  <p className="text-xs text-slate-400">감소 추세 번호가 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {downTrendNumbers.map((r) => (
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
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                <h4 className="text-sm font-semibold text-emerald-300">
                  증가 추세 번호 ({upTrendNumbers.length}개)
                  <span className="ml-2 text-xs font-normal text-slate-400">MA4 또는 MA12 &gt; MA52</span>
                </h4>
                {upTrendNumbers.length === 0 ? (
                  <p className="text-xs text-slate-400">증가 추세 번호가 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {upTrendNumbers.map((r) => (
                      <span
                        key={r.number}
                        className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-emerald-500/25 px-2 text-sm font-bold text-emerald-200"
                      >
                        {r.number}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4 space-y-2">
                <h4 className="text-sm font-semibold text-indigo-300">
                  보류 번호 ({holdNumbers.length}개)
                  <span className="ml-2 text-xs font-normal text-slate-400">MA4 = MA12 = 0%</span>
                </h4>
                {holdNumbers.length === 0 ? (
                  <p className="text-xs text-slate-400">보류 번호가 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {holdNumbers.map((r) => (
                      <span
                        key={r.number}
                        className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-indigo-500/25 px-2 text-sm font-bold text-indigo-200"
                      >
                        {r.number}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 번호별 MA 비율 테이블 */}
          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
            <h3 className="text-xl font-semibold text-white">번호별 이동평균 출현율 상세</h3>

            {noHistory ? (
              <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
            ) : !hasSearched ? (
              <p className="text-sm text-slate-300">조회를 실행하면 번호별 MA 출현율 테이블이 표시됩니다.</p>
            ) : isSearching ? (
              <p className="text-sm text-slate-300">데이터를 계산하는 중입니다...</p>
            ) : searchError ? (
              <p className="text-sm text-rose-300">{searchError}</p>
            ) : !hasResults ? (
              <p className="text-sm text-slate-300">집계할 이전 회차 데이터가 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left" style={{ minWidth: 680 }}>
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-slate-400">
                      <th className="py-2 pr-3 font-medium w-12">번호</th>
                      {MA_WINDOWS.map((w) => (
                        <th key={w.windowSize} className="py-2 pr-2 font-medium text-right">
                          <span style={{ color: w.color }}>{w.label}</span>
                        </th>
                      ))}
                      <th className="py-2 font-medium text-center">추세</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendResults.map((row) => {
                      const isWinning = selectedWinningNumberSet?.has(row.number) ?? false;
                      return (
                        <tr
                          key={row.number}
                          className={`border-b border-white/5 transition-colors ${
                            row.trend === 'down'
                              ? 'bg-rose-500/8 hover:bg-rose-500/12'
                              : row.trend === 'up'
                                ? 'bg-emerald-500/8 hover:bg-emerald-500/12'
                                : row.trend === 'hold'
                                  ? 'bg-indigo-500/8 hover:bg-indigo-500/12'
                                  : 'hover:bg-white/3'
                          }`}
                        >
                          <td className="py-1.5 pr-3">
                            <span
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                isWinning
                                  ? 'bg-amber-400/30 text-amber-200'
                                  : row.trend === 'down'
                                    ? 'bg-rose-500/30 text-rose-200'
                                    : row.trend === 'up'
                                      ? 'bg-emerald-500/30 text-emerald-200'
                                      : row.trend === 'hold'
                                        ? 'bg-indigo-500/30 text-indigo-200'
                                        : 'bg-white/10 text-white'
                              }`}
                            >
                              {row.number}
                            </span>
                          </td>
                          {MA_WINDOWS.map((w) => {
                            const rate = row.rates[w.windowSize] ?? 0;
                            const pct = (rate * 100).toFixed(1);
                            const isAboveExpected = rate > EXPECTED_RATE;
                            return (
                              <td
                                key={w.windowSize}
                                className={`py-1.5 pr-2 text-right tabular-nums text-xs ${
                                  isAboveExpected ? 'text-blue-300' : 'text-slate-400'
                                }`}
                              >
                                {pct}%
                              </td>
                            );
                          })}
                          <td className="py-1.5 text-center">
                            {row.trend === 'down' ? (
                              <span className="text-xs font-semibold text-rose-300 bg-rose-500/20 rounded-md px-2 py-0.5">감소</span>
                            ) : row.trend === 'up' ? (
                              <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/20 rounded-md px-2 py-0.5">증가</span>
                            ) : row.trend === 'hold' ? (
                              <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/20 rounded-md px-2 py-0.5">보류</span>
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
            )}
          </section>

          {/* 통계적 주의사항 */}
          <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">통계적 주의사항:</span>{' '}
              이동평균(MA) 출현율은 각 기간 동안 번호가 나온 빈도를 나타냅니다. 증가 추세(MA4 또는 MA12 &gt; MA52)는 최근 1개월 또는 3개월 출현율이 1년 평균을 넘은 번호이며,
              감소 추세(MA4 AND MA12 &lt; MA52)는 두 단기 평균 모두 1년 평균보다 낮음을 의미합니다.
              보류(MA4 = MA12 = 0%)는 최근 3개월간 전혀 출현하지 않은 번호로, 상대적으로 출현 가능성이 열려 있는 번호입니다.
              단기 추세는 노이즈에 민감하며, 로또는 매 회 독립 시행이므로 과거 추세가 미래 결과를 보장하지 않습니다.
              참고 지표로만 활용하세요.
            </p>
          </section>

        </main>
      </div>
    </div>
  );
}
