'use client';

import { ErrorAlert } from '@/app/recommend/ui/alert/ErrorAlert';
import { AnalysisController } from '@/app/recommend/ui/controller/AnalysisController';
import { AnalysisResultList } from '@/app/recommend/ui/result/AnalysisResultList';
import { useRecommendData } from '@/app/recommend/hooks/useRecommendData';
import { useRecommendGeneration } from '@/app/recommend/hooks/useRecommendGeneration';

/** 추천 페이지 본문 — 컨트롤러·결과 */

export const RecommendMain = () => {
  const data = useRecommendData();
  const gen = useRecommendGeneration({
    selectedDraw: data.selectedDraw,
    setGeneratedSets: data.setGeneratedSets,
    setAdoptedNumbers: data.setAdoptedNumbers,
    setCombinationSummaryLines: data.setCombinationSummaryLines,
    setStatusMessage: data.setStatusMessage,
    setError: data.setError,
  });

  return (
    <main className="flex-1 overflow-y-auto pb-12 px-4 pt-6 space-y-6">
      <AnalysisController
        onGenerateAndSave={gen.handleGenerateAndSave}
        isGenerating={gen.isGenerating}
        availableDraws={data.availableDraws}
        selectedDraw={data.selectedDraw}
        onDrawChange={data.setSelectedDraw}
        isLoadingDraws={data.isLoadingDraws}
        winningNumbers={data.winningNumbers}
      />
      {data.drawLoadError ? <ErrorAlert message={`회차 로드 오류: ${data.drawLoadError}`} /> : null}
      {data.error ? <ErrorAlert message={`데이터 통신 오류: ${data.error}`} /> : null}
      <AnalysisResultList
        statusMessage={data.statusMessage}
        targetDrawNo={data.selectedDraw}
        adoptedNumbers={data.adoptedNumbers}
        combinationSummaryLines={data.combinationSummaryLines}
        sets={data.generatedSets}
        winningNumbers={data.winningNumbers ?? undefined}
      />
    </main>
  );
};
