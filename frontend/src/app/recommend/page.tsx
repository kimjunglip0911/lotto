'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { AnalysisController } from '@/app/recommend/components/AnalysisController';
import { AnalysisResultList } from '@/app/recommend/components/AnalysisResultList';
import { runRecommendPipeline } from '@/app/recommend/logic/pipeline';
import { excludeTopRankFromWindowsRule } from '@/app/recommend/logic/rules/excludeTopRankFromWindows';
import { excludeChiSquareHighDeviationRule } from '@/app/recommend/logic/rules/excludeChiSquareHighDeviation';
import { excludeTrendDownRule } from '@/app/recommend/logic/rules/excludeTrendDown';
import { ChiSquareHistoryRow, ExclusionCandidatesResponse, GeneratedSet, RecommendPipelineResult, TrendNumberResult } from '@/app/recommend/logic/types';

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

function isChiSquareHistoryRow(value: unknown): value is ChiSquareHistoryRow {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.draw_no === 'number' &&
    typeof row.num1 === 'number' &&
    typeof row.num2 === 'number' &&
    typeof row.num3 === 'number' &&
    typeof row.num4 === 'number' &&
    typeof row.num5 === 'number' &&
    typeof row.num6 === 'number' &&
    typeof row.bonus_num === 'number'
  );
}

const TOTAL_NUMBERS = 45;
const TREND_WINDOW_SIZES = [4, 12, 52] as const;

function buildCountsFromRows(rows: { num1: number; num2: number; num3: number; num4: number; num5: number; num6: number; bonus_num: number }[]): number[] {
  const counts = Array.from({ length: TOTAL_NUMBERS }, () => 0);
  for (const row of rows) {
    const nums = [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6, row.bonus_num];
    for (const num of nums) {
      if (num >= 1 && num <= TOTAL_NUMBERS) counts[num - 1] += 1;
    }
  }
  return counts;
}

function buildTrendResults(
  windowDataMap: Map<number, { num1: number; num2: number; num3: number; num4: number; num5: number; num6: number; bonus_num: number }[]>,
): TrendNumberResult[] {
  return Array.from({ length: TOTAL_NUMBERS }, (_, i) => {
    const rows4 = windowDataMap.get(4) ?? [];
    const rows12 = windowDataMap.get(12) ?? [];
    const rows52 = windowDataMap.get(52) ?? [];

    const rate = (rows: typeof rows4) =>
      rows.length === 0 ? 0 : buildCountsFromRows(rows)[i] / rows.length;

    const ma4 = rate(rows4);
    const ma12 = rate(rows12);
    const ma52 = rate(rows52);

    const trend: TrendNumberResult['trend'] =
      ma4 === 0 && ma12 === 0
        ? 'hold'
        : ma4 >= ma52 || ma12 >= ma52
          ? 'up'
          : ma4 < ma52 && ma12 < ma52
            ? 'down'
            : 'neutral';

    return { number: i + 1, trend };
  });
}

function isWinningRow(value: unknown): value is { draw_no: number; num1: number; num2: number; num3: number; num4: number; num5: number; num6: number; bonus_num: number } {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.draw_no === 'number' &&
    typeof r.num1 === 'number' &&
    typeof r.num2 === 'number' &&
    typeof r.num3 === 'number' &&
    typeof r.num4 === 'number' &&
    typeof r.num5 === 'number' &&
    typeof r.num6 === 'number' &&
    typeof r.bonus_num === 'number'
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
  const [pipelineResult, setPipelineResult] = useState<RecommendPipelineResult | null>(null);
  const [generatedSets, setGeneratedSets] = useState<GeneratedSet[]>([]);

  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<number | null>(null);
  const [isLoadingDraws, setIsLoadingDraws] = useState(true);
  const [drawLoadError, setDrawLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDrawNumbers = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/api/analysis/accumulated-numbers/draw-numbers`);

        if (!response.ok) {
          throw new Error(`Failed to fetch draw numbers: ${response.status}`);
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Draw numbers response is not an array');
        }

        const draws = data.filter((item): item is number => typeof item === 'number');
        if (!isMounted) return;

        const nextDraw = draws.length > 0 ? draws[0] + 1 : 1;
        setAvailableDraws([nextDraw, ...draws]);
        setSelectedDraw(nextDraw);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching draw numbers:', err);
        setAvailableDraws([]);
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
    };
  }, []);

  useEffect(() => {
    if (!selectedDraw || isLoadingDraws) return;

    let isMounted = true;

    const loadSavedSets = async () => {
      setPipelineResult(null);
      setGeneratedSets([]);
      setError(null);
      setStatusMessage(`${selectedDraw}회차 저장된 추천 세트를 불러오는 중입니다...`);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

        const trendFetches = TREND_WINDOW_SIZES.map((ws) =>
          fetch(`${apiUrl}/api/analysis/trend/winning-numbers-window?draw_no=${selectedDraw}&window_size=${ws}`),
        );

        const [drawingsResponse, exclusionResponse, chiSquareRangeResponse, ...trendResponses] = await Promise.all([
          fetch(`${apiUrl}/api/recommend/drawings?draw_no=${selectedDraw}`),
          fetch(`${apiUrl}/api/recommend/exclusion-candidates?draw_no=${selectedDraw}`),
          fetch(`${apiUrl}/api/analysis/chi-square/winning-numbers-range?draw_no=${selectedDraw}`),
          ...trendFetches,
        ]);

        if (!drawingsResponse.ok) {
          throw new Error(`Failed to fetch drawings: ${drawingsResponse.status}`);
        }
        if (!exclusionResponse.ok) {
          throw new Error(`Failed to fetch exclusion candidates: ${exclusionResponse.status}`);
        }

        const [drawingsData, exclusionData, chiSquareRangeData, ...trendDataList]: [unknown, unknown, unknown, ...unknown[]] = await Promise.all([
          drawingsResponse.json(),
          exclusionResponse.json(),
          // 카이제곱 이력 fetch 실패 시 빈 배열로 graceful fallback
          chiSquareRangeResponse.ok ? chiSquareRangeResponse.json() : Promise.resolve([]),
          ...trendResponses.map((r) => (r.ok ? r.json() : Promise.resolve([]))),
        ]);

        if (!Array.isArray(drawingsData)) {
          throw new Error('Drawings response is not an array');
        }
        if (!isExclusionCandidatesResponse(exclusionData)) {
          throw new Error('Exclusion candidates response is invalid');
        }

        const chiSquareRows = Array.isArray(chiSquareRangeData)
          ? chiSquareRangeData.filter(isChiSquareHistoryRow)
          : [];

        const windowDataMap = new Map(
          TREND_WINDOW_SIZES.map((ws, idx) => [
            ws,
            Array.isArray(trendDataList[idx]) ? (trendDataList[idx] as unknown[]).filter(isWinningRow) : [],
          ]),
        );
        const trendResults = buildTrendResults(windowDataMap);

        const sets = drawingsData.filter(isGeneratedSet);
        const pipeline = runRecommendPipeline(
          { exclusionCandidates: exclusionData, chiSquareRows, trendResults },
          [excludeTopRankFromWindowsRule, excludeChiSquareHighDeviationRule, excludeTrendDownRule]
        );

        if (!isMounted) return;

        setGeneratedSets(sets);
        setPipelineResult(pipeline);

        if (sets.length > 0) {
          setStatusMessage(`${selectedDraw}회차 기준 저장된 ${sets.length}개 추천 세트를 불러왔습니다.`);
        } else {
          setStatusMessage(`${selectedDraw}회차 기준 저장된 추천 세트가 없습니다. 생성 및 저장 실행 버튼을 눌러 생성하세요.`);
        }
      } catch (err) {
        if (!isMounted) return;
        setGeneratedSets([]);
        setPipelineResult(null);
        setStatusMessage(`${selectedDraw}회차 세트 조회 중 오류가 발생했습니다.`);
        console.error('Error fetching saved drawings:', err);
      }
    };

    void loadSavedSets();

    return () => {
      isMounted = false;
    };
  }, [selectedDraw, isLoadingDraws]);

  const handleGenerateAndSave = async () => {
    if (!selectedDraw) return;

    setIsGenerating(true);
    setError(null);
    setStatusMessage('분석 기반 제외 후보를 조회하는 중입니다...');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const trendFetches = TREND_WINDOW_SIZES.map((ws) =>
        fetch(`${apiUrl}/api/analysis/trend/winning-numbers-window?draw_no=${selectedDraw}&window_size=${ws}`),
      );

      const [exclusionResponse, chiSquareRangeResponse, ...trendResponses] = await Promise.all([
        fetch(`${apiUrl}/api/recommend/exclusion-candidates?draw_no=${selectedDraw}`),
        fetch(`${apiUrl}/api/analysis/chi-square/winning-numbers-range?draw_no=${selectedDraw}`),
        ...trendFetches,
      ]);
      if (!exclusionResponse.ok) {
        throw new Error(`Failed to fetch exclusion candidates: ${exclusionResponse.status}`);
      }

      const [exclusionData, chiSquareRangeData, ...trendDataList]: [unknown, unknown, ...unknown[]] = await Promise.all([
        exclusionResponse.json(),
        chiSquareRangeResponse.ok ? chiSquareRangeResponse.json() : Promise.resolve([]),
        ...trendResponses.map((r) => (r.ok ? r.json() : Promise.resolve([]))),
      ]);
      if (!isExclusionCandidatesResponse(exclusionData)) {
        throw new Error('Exclusion candidates response is invalid');
      }

      const chiSquareRows = Array.isArray(chiSquareRangeData)
        ? chiSquareRangeData.filter(isChiSquareHistoryRow)
        : [];

      const windowDataMap = new Map(
        TREND_WINDOW_SIZES.map((ws, idx) => [
          ws,
          Array.isArray(trendDataList[idx]) ? (trendDataList[idx] as unknown[]).filter(isWinningRow) : [],
        ]),
      );
      const trendResults = buildTrendResults(windowDataMap);

      const nextPipelineResult = runRecommendPipeline(
        { exclusionCandidates: exclusionData, chiSquareRows, trendResults },
        [excludeTopRankFromWindowsRule, excludeChiSquareHighDeviationRule, excludeTrendDownRule]
      );
      setPipelineResult(nextPipelineResult);

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
          <AnalysisController
            onGenerateAndSave={handleGenerateAndSave}
            isGenerating={isGenerating}
            availableDraws={availableDraws}
            selectedDraw={selectedDraw}
            onDrawChange={setSelectedDraw}
            isLoadingDraws={isLoadingDraws}
          />
          {drawLoadError ? <div className="text-red-400 py-4 text-center border border-red-900/50 rounded-lg bg-red-950/20 mt-4">회차 로드 오류: {drawLoadError}</div> : null}
          {error ? <div className="text-red-400 py-4 text-center border border-red-900/50 rounded-lg bg-red-950/20 mt-4">데이터 통신 오류: {error}</div> : null}
          <AnalysisResultList
            statusMessage={statusMessage}
            targetDrawNo={selectedDraw}
            appliedRules={pipelineResult?.appliedRules ?? []}
            excludedNumbers={pipelineResult?.excludedNumbers ?? []}
            sets={generatedSets}
          />
        </main>
      </div>
    </div>
  );
}
