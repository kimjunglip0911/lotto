'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';

export default function AccumulatedNumbersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const availableDraws = Array.from({ length: 20 }, (_, index) => 1180 - index);
  const [selectedDraw, setSelectedDraw] = useState<string>(String(availableDraws[0] ?? ''));
  const [searchedDraw, setSearchedDraw] = useState<string>('');

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
                  className="bg-slate-900 border border-white/20 rounded-xl px-4 py-2.5 text-white font-semibold focus:border-primary outline-none transition-all cursor-pointer shadow-inner"
                >
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
                disabled={!selectedDraw}
                className={`h-[44px] px-5 rounded-xl font-semibold text-sm transition-all ${
                  selectedDraw
                    ? 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:border-primary/60 cursor-pointer'
                    : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                }`}
              >
                조회
              </button>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              {searchedDraw
                ? `${searchedDraw}회 기준 누적 번호 분석 조회를 준비 중입니다. 다음 단계에서 결과 데이터가 연결됩니다.`
                : '회차를 선택한 뒤 조회 버튼을 누르면 해당 회차 기준 분석을 시작합니다.'}
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
