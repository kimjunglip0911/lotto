'use client';

import React from 'react';
import { GeneratedSet, RecommendRuleResult } from '@/app/recommend/logic/types';

interface AnalysisResultListProps {
  statusMessage?: string | null;
  targetDrawNo?: number | null;
  appliedRules?: RecommendRuleResult[];
  excludedNumbers?: number[];
  sets?: GeneratedSet[];
  winningNumbers?: number[];
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
  'exclude-trend-down': {
    label: '추세 감소 번호 제외',
    badgeClass: 'bg-purple-500/20 text-purple-200 border border-purple-500/40',
    headerClass: 'text-purple-300',
  },
};

const DEFAULT_RULE_DISPLAY = {
  label: '제외 번호',
  badgeClass: 'bg-white/10 text-slate-200 border border-white/20',
  headerClass: 'text-slate-300',
}

/** 세트 생성 전략 배지 */
const STRATEGY_LABEL: Record<string, string> = {
  deterministic: '최적 커버리지',
}

const STRATEGY_BADGE: Record<string, string> = {
  deterministic: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
}

const STRATEGY_BADGE_DEFAULT = 'bg-white/10 text-slate-300 border-white/20';

export const AnalysisResultList: React.FC<AnalysisResultListProps> = ({
  statusMessage,
  targetDrawNo,
  appliedRules = [],
  excludedNumbers = [],
  sets = [],
  winningNumbers,
}) => {
  /** 모든 규칙에서 복원된 번호의 합집합 - 어느 규칙 카드에서도 제외 번호로 표시하지 않는다 */
  const globalRestoredSet = new Set(
    appliedRules.flatMap((r) => r.restoredNumbers ?? []),
  );
  const winningSet = new Set(winningNumbers ?? []);

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
              /**
               * 누적 규칙은 복원 대상이 아니므로 필터 없이 그대로 표시.
               * 나머지 규칙은 복원된 번호를 제거한다.
               */
              const displayExcluded = [...new Set(rule.excludedNumbers)]
                .filter((n) => rule.ruleId === 'exclude-top-rank-from-windows' || !globalRestoredSet.has(n))
                .sort((a, b) => a - b);
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
                  {displayExcluded.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {displayExcluded.map((num) => (
                        <span
                          key={`${rule.ruleId}-${num}`}
                          className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ${winningSet.has(num) ? 'bg-red-600/80 text-white border border-red-400' : display.badgeClass}`}
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">해당 없음</p>
                  )}
                  {rule.restoredNumbers && rule.restoredNumbers.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold text-emerald-400">추세 복원 번호 (제외 목록에서 제거)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[...new Set(rule.restoredNumbers)].sort((a, b) => a - b).map((num) => (
                          <span
                            key={`${rule.ruleId}-restored-${num}`}
                            className="inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-500/40"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
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
                      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ${winningSet.has(num) ? 'bg-red-600/80 text-white border border-red-400' : 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/40'}`}
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
          <div className="pt-1 space-y-2">
            <p className="text-slate-100 font-semibold">생성된 추천 세트</p>
            <ul className="space-y-1.5">
              {sets.map((set, index) => (
                <li key={`${set.method}-${index}`} className="flex items-center gap-2 text-slate-200">
                  <span className="w-6 text-right text-xs text-slate-500 shrink-0">{index + 1}.</span>
                  <span>{set.num1}, {set.num2}, {set.num3}, {set.num4}, {set.num5}, {set.num6}</span>
                  {set.strategy ? (
                    <span className={`ml-auto shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold border ${STRATEGY_BADGE[set.strategy] ?? STRATEGY_BADGE_DEFAULT}`}>
                      {STRATEGY_LABEL[set.strategy] ?? set.strategy}
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
