/** 세트 생성 전략 배지 — 레거시 키 + combo: 접두사 */
const STRATEGY_LABEL: Record<string, string> = {
  deterministic: '최적 커버리지',
  'position-diversity': '위치별 다양성',
  'theme-diversity': '주제별 다양성',
}

const STRATEGY_BADGE: Record<string, string> = {
  deterministic: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
  'position-diversity': 'bg-sky-500/20 text-sky-200 border-sky-500/40',
  'theme-diversity': 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/40',
}

const STRATEGY_BADGE_DEFAULT = 'bg-white/10 text-slate-300 border-white/20'

export function getStrategyLabel(strategy: string): string {
  if (strategy.startsWith('theme:')) {
    return strategy.replace('theme:', '')
  }
  if (strategy.startsWith('combo:')) {
    return strategy.replace('combo:', '조합 ')
  }
  return STRATEGY_LABEL[strategy] ?? strategy
}

export function getStrategyBadge(strategy: string): string {
  if (strategy.startsWith('theme:')) {
    return STRATEGY_BADGE['theme-diversity']
  }
  if (strategy.startsWith('combo:')) {
    return 'bg-violet-500/20 text-violet-200 border-violet-500/40'
  }
  return STRATEGY_BADGE[strategy] ?? STRATEGY_BADGE_DEFAULT
}
