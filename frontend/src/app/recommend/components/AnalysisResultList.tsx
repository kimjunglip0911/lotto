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

/** 규칙 ID별 표시 설정 */
const RULE_DISPLAY: Record<string, { label: string; badgeClass: string; headerClass: string }> = {
  'exclude-top-rank-from-windows': {
    label: '누적(기간별) 제외 번호',
    badgeClass: 'bg-amber-500/20 text-amber-200 border border-amber-500/40',
    headerClass: 'text-amber-300',
  },
  'exclude-chi-square-high-deviation': {
    label: '카이제곱 +편차 초과 제외 번호',
    badgeClass: 'bg-blue-500/20 text-blue-200 border border-blue-500/40',
    headerClass: 'text-blue-300',
  },
};

const DEFAULT_RULE_DISPLAY = {
  label: '제외 번호',
  badgeClass: 'bg-white/10 text-slate-200 border border-white/20',
  headerClass: 'text-slate-300',
};

export const AnalysisResultList: React.FC<AnalysisResultListProps> = ({
  statusMessage,
  targetDrawNo,
  appliedRules = [],
  excludedNumbers = [],
  sets = [],
}) => {
  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="rounded-xl border border-card-border/60 bg-card/30 px-5 py-6 text-sm text-slate-300 space-y-4">
        <h4 className="text-base font-semibold text-white">추천 로직 실행 결과</h4>
        <p>추천 로직은 제외 번호를 누적한 뒤 최종 추천 세트를 생성 및 저장합니다.</p>
        {targetDrawNo ? <p className="text-slate-200">기준 회차: {targetDrawNo}회</p> : null}
        {statusMessage ? <p className="text-emerald-300">{statusMessage}</p> : null}

        {/* 규칙별 제외 번호 구분 표시 */}
        {appliedRules.length > 0 ? (
          <div className="space-y-3">
            <p className="text-slate-100 font-semibold">적용된 로직</p>
            {appliedRules.map((rule) => {
              const display = RULE_DISPLAY[rule.ruleId] ?? DEFAULT_RULE_DISPLAY;
              return (
                <div
                  key={rule.ruleId}
                  className="rounded-lg border border-white/10 bg-slate-900/40 px-4 py-3 space-y-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-semibold ${display.headerClass}`}>
                      {display.label}
                    </span>
                    <span className="text-xs text-slate-500">({rule.ruleName})</span>
                  </div>
                  <p className="text-xs text-slate-400">{rule.reason}</p>
                  {rule.excludedNumbers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {[...new Set(rule.excludedNumbers)].sort((a, b) => a - b).map((num) => (
                        <span
                          key={`${rule.ruleId}-${num}`}
                          className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ${display.badgeClass}`}
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">해당 없음</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* 전체 사용 가능 번호 */}
        {(() => {
          const excludedSet = new Set(excludedNumbers);
          const availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1).filter((n) => !excludedSet.has(n));
          return (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 space-y-2">
              <p className="text-sm font-semibold text-emerald-300">전체 사용 가능 번호</p>
              {availableNumbers.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {availableNumbers.map((num) => (
                    <span
                      key={`available-${num}`}
                      className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-emerald-500/25 px-2 text-xs font-bold text-emerald-200 border border-emerald-500/40"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">해당 없음</p>
              )}
            </div>
          );
        })()}

        {/* 생성된 추천 세트 */}
        {sets.length > 0 ? (
          <div className="pt-1 space-y-1">
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
