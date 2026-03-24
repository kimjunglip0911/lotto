'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { AnalysisController } from '@features/analysis/components/AnalysisController';
import { AnalysisResultList } from '@features/analysis/components/AnalysisResultList';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

interface LotterySet {
  id?: number;
  draw_no?: number;
  method?: string;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
}

export default function AnalysisPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<number | 'new'>('new');
  const [generatedSets, setGeneratedSets] = useState<LotterySet[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingWheel, setIsGeneratingWheel] = useState(false);
  const [isWheelPreview, setIsWheelPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const drawsRes = await fetch(`${baseUrl}/api/drawings/draw-numbers`);
        if (!drawsRes.ok) throw new Error('회차 목록을 불러오는데 실패했습니다.');
        const draws: number[] = await drawsRes.json();
        setAvailableDraws(draws.slice(0, 50));
      } catch (err: unknown) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchSavedSets = async () => {
      if (selectedDraw === 'new') {
        setGeneratedSets([]);
        setIsWheelPreview(false);
        return;
      }
      try {
        setIsWheelPreview(false);
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${baseUrl}/api/drawings/by-no?draw_no=${selectedDraw}`);
        if (!res.ok) throw new Error('조회에 실패했습니다.');
        const data = await res.json();
        if (isMounted) setGeneratedSets(data);
      } catch (err: unknown) {
        if (isMounted) setError(errorMessage(err));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSavedSets();
    return () => {
      isMounted = false;
    };
  }, [selectedDraw]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const targetDraw = selectedDraw === 'new' ? (availableDraws.length > 0 ? availableDraws[0] + 1 : 1) : selectedDraw;
      const response = await fetch(`${baseUrl}/api/analysis/generate-and-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draw_no: targetDraw }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || '번호 생성 및 저장에 실패했습니다.');
      }
      const refreshedRes = await fetch(`${baseUrl}/api/drawings/by-no?draw_no=${targetDraw}`);
      if (refreshedRes.ok) {
        const refreshedData = await refreshedRes.json();
        setGeneratedSets(refreshedData);
        setIsWheelPreview(false);
        if (selectedDraw === 'new') {
          setAvailableDraws((prev) => [targetDraw as number, ...prev]);
          setSelectedDraw(targetDraw as number);
        }
      }
    } catch (err: unknown) {
      const msg = errorMessage(err);
      setError(msg);
      alert(`오류: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateWheel = async () => {
    setIsGeneratingWheel(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/analysis/generate/wheel?count=20`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error((errData as { detail?: string }).detail || '휠 시뮬레이션 생성에 실패했습니다.');
      }
      const data = (await response.json()) as LotterySet[];
      setGeneratedSets(data);
      setIsWheelPreview(true);
    } catch (err: unknown) {
      const message = errorMessage(err);
      setError(message);
      alert(`오류: ${message}`);
    } finally {
      setIsGeneratingWheel(false);
    }
  };

  const availableMethods = ['순서 통계량', 'CDM 바이시안', 'LSTM', 'Bi-LSTM', 'CNN', '마르코프 체인', '유전 알고리즘', '입자 군집 최적화', '조합론적 템플릿 분석', '행동 경제학 분석'];
  const generatedMethods = new Set(generatedSets.map((set) => set.method));
  const isMaxReached = availableMethods.every((m) => generatedMethods.has(m));

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-6 space-y-6">
          <div className="flex flex-col gap-2 mb-4">
            <h2 className="text-3xl font-bold text-white tracking-tight">로또 분석 및 번호 추천</h2>
            <p className="text-slate-400 text-sm">다양한 분석 기법을 통해 회차별 유력 후보 번호 세트를 추천합니다.</p>
          </div>
          <AnalysisController
            availableDraws={availableDraws}
            selectedDraw={selectedDraw}
            onDrawSelect={setSelectedDraw}
            onGenerate={handleGenerate}
            onGenerateWheel={handleGenerateWheel}
            isGenerating={isGenerating}
            isGeneratingWheel={isGeneratingWheel}
            isMaxReached={isMaxReached}
            totalSets={generatedSets.length}
          />
          {error ? <div className="text-red-400 py-4 text-center border border-red-900/50 rounded-lg bg-red-950/20 mt-4">데이터 통신 오류: {error}</div> : null}
          <AnalysisResultList
            sets={generatedSets}
            loading={loading}
            error={error}
            bannerNote={isWheelPreview ? '휠 시뮬레이션 결과입니다. 서버 DB에 저장되지 않았습니다.' : null}
            sectionTitle={isWheelPreview ? '휠 시뮬레이션 20세트 (미저장)' : undefined}
          />
        </main>
      </div>
    </div>
  );
}

