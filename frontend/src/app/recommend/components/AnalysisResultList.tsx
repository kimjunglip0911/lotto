'use client';

import React from 'react';
import { GeneratedSet, RecommendRuleResult } from '@/app/recommend/logic/types';

interface AnalysisResultListProps {
  statusMessage?: string | null;
  targetDrawNo?: number | null;
  appliedRules?: RecommendRuleResult[];
  excludedNumbers?: number[];
  sets?: GeneratedSet[];
}

export const AnalysisResultList: React.FC<AnalysisResultListProps> = ({
  statusMessage,
  targetDrawNo,
  appliedRules = [],
  excludedNumbers = [],
  sets = [],
}) => {
  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="rounded-xl border border-card-border/60 bg-card/30 px-5 py-6 text-sm text-slate-300 space-y-2">
        <h4 className="text-base font-semibold text-white">추천 로직 실행 결과</h4>
        <p>추천 로직은 제외 번호를 누적한 뒤 최종 추천 세트를 생성 및 저장합니다.</p>
        {targetDrawNo ? <p className="text-slate-200">기준 회차: {targetDrawNo}회</p> : null}
        {statusMessage ? <p className="text-emerald-300">{statusMessage}</p> : null}

        {appliedRules.length > 0 ? (
          <div className="pt-2 space-y-1">
            <p className="text-slate-100 font-semibold">적용된 로직</p>
            <ul className="list-disc list-inside space-y-1">
              {appliedRules.map((rule) => (
                <li key={rule.ruleId}>
                  <span className="text-slate-100">{rule.ruleName}</span> - {rule.reason}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {excludedNumbers.length > 0 ? (
          <p>
            제외 번호: <span className="text-rose-300">{excludedNumbers.join(', ')}</span>
          </p>
        ) : null}

        {sets.length > 0 ? (
          <div className="pt-2 space-y-1">
            <p className="text-slate-100 font-semibold">생성된 추천 세트</p>
            <ul className="space-y-1">
              {sets.map((set, index) => (
                <li key={`${set.method}-${index}`} className="text-slate-200">
                  {index + 1}. {set.num1}, {set.num2}, {set.num3}, {set.num4}, {set.num5}, {set.num6}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
};

