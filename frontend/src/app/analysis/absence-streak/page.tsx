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

type StreakResult = {
  number: number;
  lastDrawNo: number | null;
  streak: number;
  isCold: boolean;
};

const TOTAL_NUMBERS = 45;

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

const buildStreakResults = (rows: WinningNumberRow[], selectedDrawNo: number): StreakResult[] => {
  const lastSeen: (number | null)[] = Array.from({ length: TOTAL_NUMBERS }, () => null);

  for (const row of rows) {
    const nums = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6, row.bonus_num];
    for (const num of nums) {
      if (num >= 1 && num <= TOTAL_NUMBERS) {
        const prev = lastSeen[num - 1];
        if (prev === null || row.draw_no > prev) {
          lastSeen[num - 1] = row.draw_no;
        }
      }
    }
  }

  const streaks = lastSeen.map((last, index) => ({
    number: index + 1,
    lastDrawNo: last,
    streak: last === null ? selectedDrawNo : selectedDrawNo - last,
  }));

  const averageStreak = streaks.reduce((sum, s) => sum + s.streak, 0) / streaks.length;

  return streaks.map((s) => ({
    ...s,
    isCold: averageStreak > 0 && s.streak > averageStreak,
  }));
};

export default function AbsenceStreakPage() {
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
  const [streakResults, setStreakResults] = useState<StreakResult[]>([]);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadDrawNumbers = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/api/analysis/absence-streak/draw-numbers`, {
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
    setStreakResults([]);
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
        const res = await fetch(`${apiUrl}/api/analysis/absence-streak/winning-number?draw_no=${drawNo}`);
        if (!res.ok) throw new Error(`Failed to fetch winning number: ${res.status}`);
        const data: unknown = await res.json();
        if (!isWinningNumberRow(data)) throw new Error('Winning number response is invalid');
        setSelectedWinningNumber(data);
        resetResults();
        setAnalyzedDrawCount(0);
        return;
      }

      const [winningNumberRes, rangeRes] = await Promise.all([
        fetch(`${apiUrl}/api/analysis/absence-streak/winning-number?draw_no=${drawNo}`),
        fetch(`${apiUrl}/api/analysis/absence-streak/winning-numbers-range?draw_no=${drawNo}`),
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
      setStreakResults(buildStreakResults(rows, drawNo));
    } catch (error) {
      console.error('Error fetching absence streak data:', error);
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

  const averageStreak = streakResults.length > 0
    ? streakResults.reduce((sum, r) => sum + r.streak, 0) / streakResults.length
    : 0;

  const top5PctThreshold = (() => {
    if (streakResults.length === 0) return 0;
    const sorted = [...streakResults.map((s) => s.streak)].sort((a, b) => a - b);
    const idx = Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1);
    return sorted[idx];
  })();

  const CHART_H = 160;

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
          {hasSearched && !noHistory && !isSearching && !searchError && streakResults.length > 0 && (
            <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: '분석 회차 수 (N)', value: `${analyzedDrawCount}회` },
                { label: '최장 연속 미출현', value: `${maxStreak}회차` },
                { label: '평균 미출현 기간', value: averageStreak > 0 ? `${averageStreak.toFixed(1)}회차` : '-' },
                { label: '상위 5% 임계값', value: top5PctThreshold > 0 ? `${top5PctThreshold}회차` : '-' },
                { label: '저빈도 후보 (평균 초과)', value: `${coldNumbers.length}개` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 flex flex-col gap-1">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xl font-bold text-white">{value}</span>
                </div>
              ))}
            </section>
          )}

          {/* 연속 미출현 막대 차트 */}
          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-semibold text-white">번호별 연속 미출현 기간 차트</h3>
              {hasSearched && !noHistory && streakResults.length > 0 && (
                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-amber-400/50 border border-amber-400/70" />
                    선택 회차 당첨번호
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-orange-500/70 border border-orange-500/90" />
                    저빈도 후보 (평균 초과)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-indigo-500/60 border border-indigo-500/80" />
                    일반 미출현
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-6 border-t-2 border-dashed border-violet-400/80" />
                    상위 5%
                  </span>
                </div>
              )}
            </div>
            {noHistory ? (
              <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
            ) : !hasSearched ? (
              <p className="text-sm text-slate-300">조회를 실행하면 번호별 연속 미출현 기간 차트가 표시됩니다.</p>
            ) : isSearching ? (
              <p className="text-sm text-slate-300">차트 데이터를 계산하는 중입니다...</p>
            ) : searchError ? (
              <p className="text-sm text-rose-300">{searchError}</p>
            ) : streakResults.length === 0 ? (
              <p className="text-sm text-slate-300">집계할 이전 회차 데이터가 없습니다.</p>
            ) : (
              <div className="overflow-x-auto pb-0.5">
                <div className="relative w-max">
                  {top5PctThreshold > 0 && maxStreak > 0 && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10"
                      style={{ top: Math.round(CHART_H - (top5PctThreshold / maxStreak) * CHART_H) }}
                    >
                      <div className="w-full border-t-2 border-dashed border-violet-400/80" />
                      <span className="absolute -top-5 left-0 rounded bg-violet-500/20 px-2 py-0.5 text-[11px] font-medium text-violet-300 whitespace-nowrap">
                        상위 5% {top5PctThreshold}회차
                      </span>
                    </div>
                  )}
                  <ul className="w-max flex gap-1 items-end" style={{ height: CHART_H + 32 }}>
                    {streakResults.map((item) => {
                      const isWinningNum = selectedWinningNumberSet?.has(item.number) ?? false;
                      const barPx = maxStreak > 0 ? Math.max((item.streak / maxStreak) * CHART_H, 2) : 2;
                      const barColor = isWinningNum
                        ? 'bg-amber-400/90'
                        : item.isCold
                          ? 'bg-orange-500/90'
                          : 'bg-indigo-500/60';
                      const numColor = isWinningNum
                        ? 'text-amber-300 font-bold'
                        : item.isCold
                          ? 'text-orange-300 font-bold'
                          : 'text-slate-300 font-medium';

                      return (
                        <li key={item.number} className="w-8 shrink-0 flex flex-col items-center justify-end" style={{ height: CHART_H + 32 }}>
                          <span className="text-[10px] text-slate-200 tabular-nums leading-none mb-0.5">
                            {item.streak}
                          </span>
                          <div
                            className={`w-full rounded-t-sm ${barColor}`}
                            style={{ height: barPx }}
                          />
                          <span className={`text-[11px] leading-none mt-1 ${numColor}`}>{item.number}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </section>

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

          {/* 번호별 결과 테이블 */}
          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
            <h3 className="text-xl font-semibold text-white">번호별 연속 미출현 분석 결과</h3>

            {noHistory ? (
              <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
            ) : !hasSearched ? (
              <p className="text-sm text-slate-300">조회를 실행하면 번호별 연속 미출현 결과 테이블이 표시됩니다.</p>
            ) : isSearching ? (
              <p className="text-sm text-slate-300">데이터를 계산하는 중입니다...</p>
            ) : searchError ? (
              <p className="text-sm text-rose-300">{searchError}</p>
            ) : streakResults.length === 0 ? (
              <p className="text-sm text-slate-300">집계할 이전 회차 데이터가 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[480px]">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-slate-400">
                      <th className="py-2 pr-3 font-medium w-12">번호</th>
                      <th className="py-2 pr-3 font-medium text-right">마지막 출현 회차</th>
                      <th className="py-2 pr-3 font-medium text-right">연속 미출현</th>
                      <th className="py-2 font-medium text-center">판정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {streakResults.map((row) => (
                      <tr
                        key={row.number}
                        className={`border-b border-white/5 transition-colors ${
                          row.isCold
                            ? 'bg-orange-500/10 hover:bg-orange-500/15'
                            : 'hover:bg-white/3'
                        }`}
                      >
                        <td className="py-2 pr-3">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                              row.isCold
                                ? 'bg-orange-500/30 text-orange-200'
                                : 'bg-white/10 text-white'
                            }`}
                          >
                            {row.number}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums text-slate-300">
                          {row.lastDrawNo !== null ? `${row.lastDrawNo}회` : '출현 기록 없음'}
                        </td>
                        <td className={`py-2 pr-3 text-right tabular-nums font-semibold ${row.isCold ? 'text-orange-300' : 'text-white'}`}>
                          {row.streak}회차
                        </td>
                        <td className="py-2 text-center">
                          {row.isCold ? (
                            <span className="text-xs font-semibold text-orange-300 bg-orange-500/20 rounded-md px-2 py-0.5">저빈도 후보</span>
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

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
