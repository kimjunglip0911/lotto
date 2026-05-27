import type { CardTone } from '../../constants/cardTone';
import { SourceCardChips } from './SourceCardChips';
import { SourceCardEmpty } from './SourceCardEmpty';
import { SourceCardHdr } from './SourceCardHdr';
import { TONE_CLASSES } from '../../constants/cardTone';

type Props = {
  title: string;
  titleHint?: string;
  description?: string;
  tone: CardTone;
  numbers: number[];
  targetCount?: number;
  emptyMessage?: string;
  mainWinningSet?: Set<number>;
};

/** 출처별 제외·채택 번호 카드(tone별 색조). */
export function SourceNumbersCard(props: Props) {
  const styles = TONE_CLASSES[props.tone];
  const sortedNumbers = [...props.numbers].sort((a, b) => a - b);
  const hasNumbers = sortedNumbers.length > 0;
  const slotCount = props.targetCount ?? Math.max(props.numbers.length, 6);

  return (
    <section className={`rounded-2xl border ${styles.card} p-4 space-y-3`}>
      <SourceCardHdr
        title={props.title}
        titleHint={props.titleHint}
        description={props.description}
        targetCount={props.targetCount}
        tone={props.tone}
      />
      {hasNumbers ? (
        <SourceCardChips numbers={sortedNumbers} tone={props.tone} mainWinningSet={props.mainWinningSet} />
      ) : (
        <SourceCardEmpty slotCount={slotCount} tone={props.tone} emptyMessage={props.emptyMessage} />
      )}
    </section>
  );
}
