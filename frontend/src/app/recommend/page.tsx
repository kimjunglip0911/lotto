'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { AnalysisController } from '@/app/recommend/components/AnalysisController';
import { AnalysisResultList } from '@/app/recommend/components/AnalysisResultList';
import { runRecommendPipeline } from '@/app/recommend/logic/pipeline';
import { excludeLeastFrequentOverallRule } from '@/app/recommend/logic/rules/excludeLeastFrequentOverall';
import { excludeTopRankFromWindowsRule } from '@/app/recommend/logic/rules/excludeTopRankFromWindows';
import { ExclusionCandidatesResponse, GeneratedSet, RecommendPipelineResult } from '@/app/recommend/logic/types';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isRankedNumberInfo(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const info = value as { number?: unknown; count?: unknown; is_tie?: unknown; candidates?: unknown };
  return (
    typeof info.number === 'number' &&
    typeof info.count === 'number' &&
    typeof info.is_tie === 'boolean' &&
    Array.isArray(info.candidates)
  );
}

function isExclusionCandidatesResponse(value: unknown): value is ExclusionCandidatesResponse {
  if (typeof value !== 'object' || value === null) return false;
  const data = value as {
    drawNo?: unknown;
    leastFrequentOverall?: unknown;
    windowTopNumbers?: Record<string, unknown>;
    excludedNumbersUnion?: unknown;
  };
  const windows = data.windowTopNumbers;
  return (
    typeof data.drawNo === 'number' &&
    isRankedNumberInfo(data.leastFrequentOverall) &&
    typeof windows === 'object' &&
    windows !== null &&
    ['overall', 'sixMonth', 'oneYear', 'threeYear', 'fiveYear', 'tenYear'].every((key) => isRankedNumberInfo(windows[key])) &&
    Array.isArray(data.excludedNumbersUnion)
  );
}

function isGeneratedSet(value: unknown): value is GeneratedSet {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.num1 === 'number' &&
    typeof row.num2 === 'number' &&
    typeof row.num3 === 'number' &&
    typeof row.num4 === 'number' &&
    typeof row.num5 === 'number' &&
    typeof row.num6 === 'number' &&
    typeof row.method === 'string'
  );
}

export default function RecommendPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>('생성 및 저장 실행 버튼을 누르면 추천 로직을 적용합니다.');
  const [error, setError] = useState<string | null>(null);
  const [targetDrawNo, setTargetDrawNo] = useState<number | null>(null);
  const [pipelineResult, setPipelineResult] = useState<RecommendPipelineResult | null>(null);
  const [generatedSets, setGeneratedSets] = useState<GeneratedSet[]>([]);

  const handleGenerateAndSave = async () => {
    setIsGenerating(true);
    setError(null);
    setStatusMessage('분석 기반 제외 후보를 조회하는 중입니다...');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const exclusionResponse = await fetch(`${apiUrl}/api/recommend/exclusion-candidates`);
      if (!exclusionResponse.ok) {
        throw new Error(`Failed to fetch exclusion candidates: ${exclusionResponse.status}`);
      }

      const exclusionData: unknown = await exclusionResponse.json();
      if (!isExclusionCandidatesResponse(exclusionData)) {
        throw new Error('Exclusion candidates response is invalid');
      }

      const nextPipelineResult = runRecommendPipeline(
        { exclusionCandidates: exclusionData },
        [excludeLeastFrequentOverallRule, excludeTopRankFromWindowsRule]
      );
      setPipelineResult(nextPipelineResult);
      setTargetDrawNo(exclusionData.drawNo);

      setStatusMessage('추천 번호를 생성하고 저장하는 중입니다...');
      const generateResponse = await fetch(`${apiUrl}/api/recommend/generate-and-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draw_no: exclusionData.drawNo,
          applied_rule_ids: nextPipelineResult.appliedRules.map((rule) => rule.ruleId),
          excluded_numbers: nextPipelineResult.excludedNumbers,
        }),
      });
      if (!generateResponse.ok) {
        throw new Error(`Failed to generate and save sets: ${generateResponse.status}`);
      }

      const generatedData: unknown = await generateResponse.json();
      if (!Array.isArray(generatedData) || !generatedData.every(isGeneratedSet)) {
        throw new Error('Generate and save response is invalid');
      }

      setGeneratedSets(generatedData);
      setStatusMessage(`${exclusionData.drawNo}회차 기준으로 ${generatedData.length}개 추천 세트를 생성 및 저장했습니다.`);
    } catch (err: unknown) {
      const msg = errorMessage(err);
      setError(msg);
      setPipelineResult(null);
      setGeneratedSets([]);
      setTargetDrawNo(null);
      setStatusMessage(null);
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
            <p className="text-slate-400 text-sm">제외 로직 파이프라인을 적용해 추천 번호를 생성하고 저장합니다.</p>
          </div>
          <AnalysisController
            onGenerateAndSave={handleGenerateAndSave}
            isGenerating={isGenerating}
            targetDrawNo={targetDrawNo}
          />
          {error ? <div className="text-red-400 py-4 text-center border border-red-900/50 rounded-lg bg-red-950/20 mt-4">데이터 통신 오류: {error}</div> : null}
          <AnalysisResultList
            statusMessage={statusMessage}
            targetDrawNo={targetDrawNo}
            appliedRules={pipelineResult?.appliedRules ?? []}
            excludedNumbers={pipelineResult?.excludedNumbers ?? []}
            sets={generatedSets}
          />
        </main>
      </div>
    </div>
  );
}
