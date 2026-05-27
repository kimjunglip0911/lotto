import { TONE_CLASSES, type CardTone } from '../../constants/cardTone';

type Props = {
  numbers: number[];
  tone: CardTone;
  mainWinningSet?: Set<number>;
};

export function SourceCardChips({ numbers, tone, mainWinningSet }: Props) {
  const styles = TONE_CLASSES[tone];
  return (
    <div className="flex flex-wrap gap-2">
      {numbers.map((n) => {
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
  );
}
