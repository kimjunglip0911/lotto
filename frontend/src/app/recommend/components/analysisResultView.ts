import { RecommendRuleResult } from '@/app/recommend/logic/types';

export interface RuleDisplay {
  label: string;
  badgeClass: string;
  headerClass: string;
}

/** 규칙 ID별 표시 설정 */
export const RULE_DISPLAY: Record<string, RuleDisplay> = {
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

export const DEFAULT_RULE_DISPLAY: RuleDisplay = {
  label: '제외 번호',
  badgeClass: 'bg-white/10 text-slate-200 border border-white/20',
  headerClass: 'text-slate-300',
};

/** 세트 생성 전략 배지 */
const STRATEGY_LABEL: Record<string, string> = {
  deterministic: '최적 커버리지',
  'position-diversity': '위치별 다양성',
  'theme-diversity': '주제별 다양성',
};

const STRATEGY_BADGE: Record<string, string> = {
  deterministic: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
  'position-diversity': 'bg-sky-500/20 text-sky-200 border-sky-500/40',
  'theme-diversity': 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/40',
};

const STRATEGY_BADGE_DEFAULT = 'bg-white/10 text-slate-300 border-white/20';

export function getStrategyLabel(strategy: string): string {
  if (strategy.startsWith('theme:')) {
    return strategy.replace('theme:', '');
  }
  return STRATEGY_LABEL[strategy] ?? strategy;
}

export function getStrategyBadge(strategy: string): string {
  if (strategy.startsWith('theme:')) {
    return STRATEGY_BADGE['theme-diversity'];
  }
  return STRATEGY_BADGE[strategy] ?? STRATEGY_BADGE_DEFAULT;
}

export function getGlobalRestoredSet(appliedRules: RecommendRuleResult[]): Set<number> {
  return new Set(appliedRules.flatMap((rule) => rule.restoredNumbers ?? []));
}

export function getDisplayExcludedNumbers(
  rule: RecommendRuleResult,
  globalRestoredSet: Set<number>,
): number[] {
  return [...new Set(rule.excludedNumbers)]
    .filter((num) => rule.ruleId === 'exclude-top-rank-from-windows' || !globalRestoredSet.has(num))
    .sort((a, b) => a - b);
}

export function getAvailableNumbers(excludedNumbers: number[]): number[] {
  const excludedSet = new Set(excludedNumbers);
  return Array.from({ length: 45 }, (_, index) => index + 1).filter((num) => !excludedSet.has(num));
}
