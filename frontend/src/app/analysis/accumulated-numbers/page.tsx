'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';

export default function AccumulatedNumbersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<string>('');
  const [searchedDraw, setSearchedDraw] = useState<string>('');
  const [isLoadingDraws, setIsLoadingDraws] = useState(true);
  const [drawLoadError, setDrawLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadDrawNumbers = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/api/drawings/draw-numbers`, {
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
      abortController.abort();
    };
  }, []);

  const handleSearch = () => {
    if (!selectedDraw) {
      return;
    }
    setSearchedDraw(selectedDraw);
  };

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-6 space-y-6">
          <div className="flex flex-col gap-2 mb-4">
            <h2 className="text-3xl font-bold text-white tracking-tight">누적 번호 분석</h2>
            <p className="text-slate-400 text-sm">회차 누적 데이터를 기반으로 번호 패턴을 분석하는 화면입니다.</p>
          </div>

          <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-6 space-y-5">
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
                disabled={!selectedDraw || isLoadingDraws || availableDraws.length === 0}
                className={`h-[44px] px-5 rounded-xl font-semibold text-sm transition-all ${
                  selectedDraw && !isLoadingDraws && availableDraws.length > 0
                    ? 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:border-primary/60 cursor-pointer'
                    : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                }`}
              >
                조회
              </button>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              {isLoadingDraws
                ? '회차 정보를 불러오는 중입니다.'
                : drawLoadError
                  ? `${drawLoadError} 잠시 후 다시 시도해 주세요.`
                  : availableDraws.length === 0
                    ? '조회 가능한 회차 정보가 없습니다.'
                    : searchedDraw
                      ? `${searchedDraw}회 기준 누적 번호 분석 조회를 준비 중입니다. 다음 단계에서 결과 데이터가 연결됩니다.`
                      : '회차를 선택한 뒤 조회 버튼을 누르면 해당 회차 기준 분석을 시작합니다.'}
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
