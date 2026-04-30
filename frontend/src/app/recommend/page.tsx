'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { AnalysisController } from '@/app/recommend/components/AnalysisController';
import { AnalysisResultList } from '@/app/recommend/components/AnalysisResultList';
import { useRecommendData } from '@/app/recommend/hooks/useRecommendData';
import { useRecommendGeneration } from '@/app/recommend/hooks/useRecommendGeneration';

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="text-red-400 py-4 text-center border border-red-900/50 rounded-lg bg-red-950/20 mt-4">
      {message}
    </div>
  );
}

export default function RecommendPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {
    availableDraws,
    selectedDraw,
    setSelectedDraw,
    isLoadingDraws,
    drawLoadError,
    statusMessage,
    setStatusMessage,
    error,
    setError,
    pipelineResult,
    setPipelineResult,
    generatedSets,
    setGeneratedSets,
    winningNumbers,
    usedNumbers,
    setUsedNumbers,
  } = useRecommendData();
  const { isGenerating, handleGenerateAndSave } = useRecommendGeneration({
    selectedDraw,
    setPipelineResult,
    setGeneratedSets,
    setUsedNumbers,
    setStatusMessage,
    setError,
  });

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-6 space-y-6">
          <AnalysisController
            onGenerateAndSave={handleGenerateAndSave}
            isGenerating={isGenerating}
            availableDraws={availableDraws}
            selectedDraw={selectedDraw}
            onDrawChange={setSelectedDraw}
            isLoadingDraws={isLoadingDraws}
            winningNumbers={winningNumbers}
          />
          {drawLoadError ? <ErrorAlert message={`회차 로드 오류: ${drawLoadError}`} /> : null}
          {error ? <ErrorAlert message={`데이터 통신 오류: ${error}`} /> : null}
          <AnalysisResultList
            statusMessage={statusMessage}
            targetDrawNo={selectedDraw}
            appliedRules={pipelineResult?.appliedRules ?? []}
            excludedNumbers={pipelineResult?.excludedNumbers ?? []}
            usedNumbers={usedNumbers}
            sets={generatedSets}
            winningNumbers={winningNumbers ?? undefined}
          />
        </main>
      </div>
    </div>
  );
}
