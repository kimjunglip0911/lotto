import type { AccumulatedCountExclusionResult } from '../../logic/accuCntExt';
import { AccNumHit } from '../chip/AccNumHit';

/** 누적 출현 극값으로 뽑은 제외 후보(2년·전체 각 최다·최소)와 고유 제외 번호를 보여 줍니다. */

type Props = {
  exclusion: AccumulatedCountExclusionResult;
  hasSearched: boolean;
  drawNo: number;
  mainWinSet: ReadonlySet<number>;
};

export const AccExclBox = ({ exclusion, hasSearched, drawNo, mainWinSet }: Props) => {
  const showHit = hasSearched && drawNo > 1;
  return (
    <section className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 space-y-3">
      <h2 className="text-lg font-semibold text-rose-100">누적 출현 극값 — 후보 제외</h2>
      <p className="text-sm text-rose-100/90 leading-relaxed">
        직전 104회(2년)·선택 회차 직전 전체 구간에서 본번호 6개만 집계한 출현 횟수 기준입니다. 각 구간마다 최다
        1개·최소 1개를 고르고(동률 시 번호가 작은 쪽), 네 값을 합친 고유 번호가 제외 후보입니다. 슬롯이 같은 번호로
        겹치면 고유 개수는 4보다 작을 수 있습니다.
      </p>
      <dl className="grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-400">2년 최다</dt>
          <dd className="font-mono font-semibold">{exclusion.twoYearHighest ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">2년 최소</dt>
          <dd className="font-mono font-semibold">{exclusion.twoYearLowest ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">전체 최다</dt>
          <dd className="font-mono font-semibold">{exclusion.allTimeHighest ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">전체 최소</dt>
          <dd className="font-mono font-semibold">{exclusion.allTimeLowest ?? '—'}</dd>
        </div>
      </dl>
      <div>
        <p className="text-xs font-medium text-rose-200/90 mb-2">고유 제외 번호</p>
        <div className="flex flex-wrap gap-2">
          {exclusion.excludedUnique.map((n) => (
            <AccNumHit key={`acc-excl-${n}`} n={n} isHit={showHit && mainWinSet.has(n)} variant="excl" />
          ))}
        </div>
      </div>
    </section>
  );
};
