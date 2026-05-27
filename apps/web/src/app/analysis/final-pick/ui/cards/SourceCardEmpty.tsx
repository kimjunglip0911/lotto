import { TONE_CLASSES, type CardTone } from '../../constants/cardTone';

type Props = { slotCount: number; tone: CardTone; emptyMessage?: string };

export function SourceCardEmpty({ slotCount, tone, emptyMessage }: Props) {
  const styles = TONE_CLASSES[tone];
  return (
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
  );
}
