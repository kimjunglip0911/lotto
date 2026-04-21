'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { AnalysisController } from '@/app/recommend/components/AnalysisController';
import { AnalysisResultList } from '@/app/recommend/components/AnalysisResultList';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export default function RecommendPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>('신규 추천 번호 추출 로직 연결을 준비 중입니다.');
  const [error, setError] = useState<string | null>(null);

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7362/ingest/abffb62d-8118-4522-ba11-17c2ce3f222c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '3e606a' },
      body: JSON.stringify({
        sessionId: '3e606a',
        runId: 'ts-diagnostic-investigation',
        hypothesisId: 'H2',
        location: 'src/app/recommend/page.tsx:21',
        message: 'Recommend page mounted from current app route tree',
        data: { route: '/recommend', routeFile: 'src/app/recommend/page.tsx' },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, []);
  // #endregion

  const handleGenerateAndSave = async () => {
    setIsGenerating(true);
    setError(null);
    setStatusMessage(null);
    try {
      // TODO: 신규 추천 번호 생성/저장 API가 준비되면 이 지점에 연결합니다.
      setStatusMessage('신규 생성 로직이 아직 연결되지 않았습니다. 연결 후 즉시 사용 가능합니다.');
    } catch (err: unknown) {
      const msg = errorMessage(err);
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-6 space-y-6">
          <div className="flex flex-col gap-2 mb-4">
            <h2 className="text-3xl font-bold text-white tracking-tight">로또 번호 추천</h2>
            <p className="text-slate-400 text-sm">신규 추천 번호 생성 로직 연결을 준비하는 화면입니다.</p>
          </div>
          <AnalysisController
            onGenerateAndSave={handleGenerateAndSave}
            isGenerating={isGenerating}
          />
          {error ? <div className="text-red-400 py-4 text-center border border-red-900/50 rounded-lg bg-red-950/20 mt-4">데이터 통신 오류: {error}</div> : null}
          <AnalysisResultList statusMessage={statusMessage} />
        </main>
      </div>
    </div>
  );
}
