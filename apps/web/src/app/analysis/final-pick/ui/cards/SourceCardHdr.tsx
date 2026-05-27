import { TONE_CLASSES, type CardTone } from '../../constants/cardTone';

type Props = {
  title: string;
  titleHint?: string;
  description?: string;
  targetCount?: number;
  tone: CardTone;
};

export function SourceCardHdr({ title, titleHint, description, targetCount, tone }: Props) {
  const styles = TONE_CLASSES[tone];
  return (
    <div className="flex items-baseline justify-between gap-3 flex-wrap">
      <h3 className={`text-base font-semibold ${styles.title} flex flex-wrap items-baseline gap-x-2 gap-y-1`}>
        <span>{title}</span>
        {titleHint ? <span className={`text-xs font-medium ${styles.description}`}>{titleHint}</span> : null}
        {typeof targetCount === 'number' && (
          <span className="text-xs font-medium text-slate-300">목표 {targetCount}개</span>
        )}
      </h3>
      {description ? <span className={`text-xs font-medium ${styles.description}`}>{description}</span> : null}
    </div>
  );
}
