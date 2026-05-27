import { AdoptedChips } from './AdoptedChips';
import { AdoptedEmpty } from './AdoptedEmpty';

type Props = { numbers: number[]; targetCount: number; mainWinningSet?: Set<number> };

/** 통합 채택 번호 요약 카드(종합 차트 위). */
export function AdoptedSummaryCard({ numbers, targetCount, mainWinningSet }: Props) {
  const sortedNumbers = [...numbers].sort((a, b) => a - b);
  const hasNumbers = sortedNumbers.length > 0;

  return (
    <section className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-emerald-200">통합 채택 번호 {targetCount}</h2>
        <span className="text-xs font-medium text-emerald-100/80">
          워크포워드 잔여 중 연속·누적 출현 극값 제외 후 카이제곱 순위로 남은 번호
        </span>
      </div>
      {hasNumbers ? (
        <AdoptedChips numbers={sortedNumbers} mainWinningSet={mainWinningSet} />
      ) : (
        <AdoptedEmpty targetCount={targetCount} />
      )}
    </section>
  );
}
