'use client';

import React from 'react';
import { GeneratedSet } from '@/app/recommend/logic/types';
import { getStrategyBadge, getStrategyLabel } from '@/app/recommend/components/analysisResultView';

interface AnalysisResultListProps {
  statusMessage?: string | null;
  targetDrawNo?: number | null;
  /** 통합 분석과 동일 경로의 최종 채택 번호 */
  adoptedNumbers?: number[];
  /** 조합 생성 요약(합 구간 등) */
  combinationSummaryLines?: string[];
  sets?: GeneratedSet[];
  winningNumbers?: number[];
}

export const AnalysisResultList: React.FC<AnalysisResultListProps> = ({
  statusMessage,
  targetDrawNo,
  adoptedNumbers = [],
  combinationSummaryLines = [],
  sets = [],
  winningNumbers,
}) => {
  const winningSet = new Set(winningNumbers ?? []);

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="rounded-xl border border-card-border/60 bg-card/30 px-5 py-6 text-sm text-slate-300 space-y-4">
        <h4 className="text-base font-semibold text-white">추천 생성 결과</h4>
        <p>
          통합 분석에서 확정한 채택 번호 풀과 조합 분석(고저 합·홀짝·연속·구간별) 통계를 사용해 세트를
          만듭니다. 기준 회차에 당첨번호가 DB에 있어야 통합 채택이 계산됩니다.
        </p>
        {targetDrawNo ? <p className="text-slate-200">기준 회차: {targetDrawNo}회</p> : null}
        {statusMessage ? <p className="text-emerald-300">{statusMessage}</p> : null}

        <div className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 space-y-2">
          <p className="text-sm font-semibold text-emerald-200">통합 채택 번호</p>
          {adoptedNumbers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {[...adoptedNumbers].sort((a, b) => a - b).map((num) => (
                <span
                  key={`adopted-${num}`}
                  className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ${winningSet.has(num) ? 'bg-amber-400/90 text-slate-900 border border-amber-200' : 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/40'}`}
                >
                  {num}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">당첨번호 조회 후 채택이 계산되거나, 생성 실행 후 표시됩니다.</p>
          )}
        </div>

        {combinationSummaryLines.length > 0 ? (
          <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 px-4 py-3 space-y-1.5">
            <p className="text-sm font-semibold text-sky-200">조합 분석 요약</p>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
              {combinationSummaryLines.map((line, i) => (
                <li key={`combo-sum-${i}`}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {sets.length > 0 ? (
          <div className="pt-1 space-y-2">
            <p className="text-slate-100 font-semibold">생성된 추천 세트</p>
            <ul className="space-y-1.5">
              {sets.map((set, index) => (
                <li key={`${set.method}-${set.num1}-${set.num2}-${index}`} className="flex items-center gap-2 text-slate-200">
                  <span className="w-6 text-right text-xs text-slate-500 shrink-0">{index + 1}.</span>
                  <span>
                    {set.num1}, {set.num2}, {set.num3}, {set.num4}, {set.num5}, {set.num6}
                  </span>
                  {set.strategy ? (
                    <span
                      className={`ml-auto shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold border ${getStrategyBadge(set.strategy)}`}
                    >
                      {getStrategyLabel(set.strategy)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
};
