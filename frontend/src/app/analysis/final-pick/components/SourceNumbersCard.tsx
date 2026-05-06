type CardTone = 'exclude' | 'adoptAccumulated' | 'adoptChiSquare';

type SourceNumbersCardProps = {
  title: string;
  description: string;
  tone: CardTone;
  numbers: number[];
  /** 채택/제외 목표 개수. placeholder 슬롯 수와 카드 라벨에 활용. */
  targetCount?: number;
  emptyMessage?: string;
  mainWinningSet?: Set<number>;
};

const TONE_CLASSES: Record<
  CardTone,
  { card: string; title: string; chip: string; emptyChip: string; description: string }
> = {
  exclude: {
    card: 'border-rose-400/30 bg-rose-500/5',
    title: 'text-rose-200',
    chip: 'bg-rose-400/20 text-rose-100',
    emptyChip: 'border-rose-300/30 text-rose-200/40',
    description: 'text-rose-100/80',
  },
  adoptAccumulated: {
    card: 'border-emerald-400/30 bg-emerald-500/5',
    title: 'text-emerald-200',
    chip: 'bg-emerald-400/25 text-emerald-100',
    emptyChip: 'border-emerald-300/30 text-emerald-200/40',
    description: 'text-emerald-100/80',
  },
  adoptChiSquare: {
    card: 'border-sky-400/30 bg-sky-500/5',
    title: 'text-sky-200',
    chip: 'bg-sky-400/25 text-sky-100',
    emptyChip: 'border-sky-300/30 text-sky-200/40',
    description: 'text-sky-100/80',
  },
};

/**
 * 통합 분석 페이지의 출처별 번호 카드.
 *
 * - tone에 따라 색조만 바뀌는 동일 마크업이라 단일 컴포넌트로 정리한다.
 *   - `exclude`: 연속 미출현·추세에서 후보 풀에서 빼는 번호 (rose)
 *   - `adoptAccumulated`: 누적 분석 채택 번호 (emerald)
 *   - `adoptChiSquare`: 카이제곱 채택 번호 (sky)
 * - 빈 상태에는 `targetCount`만큼 dashed 슬롯을 깔아 레이아웃이 무너지지 않도록 한다.
 */
export function SourceNumbersCard({
  title,
  description,
  tone,
  numbers,
  targetCount,
  emptyMessage,
  mainWinningSet,
}: SourceNumbersCardProps) {
  const styles = TONE_CLASSES[tone];
  const sortedNumbers = [...numbers].sort((a, b) => a - b);
  const hasNumbers = sortedNumbers.length > 0;
  const slotCount = targetCount ?? Math.max(numbers.length, 6);

  return (
    <section className={`rounded-2xl border ${styles.card} p-4 space-y-3`}>
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className={`text-base font-semibold ${styles.title}`}>
          {title}
          {typeof targetCount === 'number' && (
            <span className="ml-2 text-xs font-medium text-slate-300">목표 {targetCount}개</span>
          )}
        </h3>
        <span className={`text-xs font-medium ${styles.description}`}>{description}</span>
      </div>

      {hasNumbers ? (
        <div className="flex flex-wrap gap-2">
          {sortedNumbers.map((n) => {
            const isMainHit = mainWinningSet?.has(n) ?? false;
            return (
              <span
                key={`source-${tone}-${n}`}
                className={
                  isMainHit
                    ? 'inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-amber-400 px-2 text-sm font-bold text-slate-900 ring-1 ring-amber-200/90 shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)]'
                    : `inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-bold ${styles.chip}`
                }
              >
                {n}
              </span>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: slotCount }).map((_, idx) => (
              <span
                key={`source-${tone}-empty-${idx}`}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-dashed bg-slate-900/40 px-2 text-sm font-semibold ${styles.emptyChip}`}
              >
                ·
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            {emptyMessage ?? '기준 회차 조회 후 표시됩니다. (상세 로직은 후속 작업에서 구현)'}
          </p>
        </div>
      )}
    </section>
  );
}
