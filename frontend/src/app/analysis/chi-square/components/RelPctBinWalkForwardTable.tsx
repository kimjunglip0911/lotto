import {
  CHI_SQUARE_DEVIATION_BIN_WIDTH,
  CHI_SQUARE_WALK_FORWARD_RECENT_DRAWS,
} from '../constants';
import type { DeviationBinRow } from '../logic/walkForwardStats';

type Props = {
  denominator: number;
  targetRoundCount: number;
  negBins: DeviationBinRow[];
  posBins: DeviationBinRow[];
};

function BinTable({
  title,
  accentClass,
  rows,
}: {
  title: string;
  accentClass: string;
  rows: DeviationBinRow[];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 overflow-hidden flex flex-col min-h-0">
      <p className={`text-sm font-semibold px-4 py-3 border-b border-white/10 ${accentClass}`}>{title}</p>
      <p className="text-[11px] text-slate-500 px-4 py-2 border-b border-white/5">
        행 정렬: 조건부 출현 확률(%)이 높은 구간이 위입니다. 동률이면 구간 키 순입니다.
      </p>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left min-w-[280px]">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="py-2 pl-4 pr-3 font-medium">편차(O−E) 구간</th>
              <th className="py-2 pr-3 font-medium text-right">슬롯 누적</th>
              <th className="py-2 pr-3 font-medium text-right">출현 회차</th>
              <th className="py-2 pr-3 font-medium text-right">겹침 회차</th>
              <th className="py-2 pr-4 font-medium text-right">조건부 확률(%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.binKey} className="border-b border-white/5 hover:bg-white/3">
                <td className="py-2 pl-4 pr-3 text-slate-200 tabular-nums">{row.label}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-white font-medium">{row.hits}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-slate-200">{row.roundsHit}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-slate-200">{row.roundsMatched}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-slate-300">{row.pct.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** 워크포워드 기준 편차(O−E)를 `CHI_SQUARE_DEVIATION_BIN_WIDTH` 폭으로 집계한 요약 표(음·양 좌우). 출현 회차가 0인 구간은 생략. */
export function RelPctBinWalkForwardTable({
  denominator,
  targetRoundCount,
  negBins,
  posBins,
}: Props) {
  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <h3 className="text-xl font-semibold text-white">
        구간별 분류 (편차 O−E, {CHI_SQUARE_DEVIATION_BIN_WIDTH} 단위)
      </h3>
      <div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 space-y-2 text-xs text-slate-300 leading-relaxed">
        <p className="text-slate-400">
          집계 구간: 조회 회차까지 당첨 데이터 중 <span className="text-slate-200 font-medium">최근 {CHI_SQUARE_WALK_FORWARD_RECENT_DRAWS}회</span>
          만 사용합니다(주 1회 추첨 가정 시 약 6개월).
        </p>
        <p>
          각 목표 회차 직전 누적 집계로 본번호 6개의 편차{' '}
          <span className="text-slate-200 font-medium">d = O−E</span>(검정 결과 표와 동일)를 구한 뒤,{' '}
          <span className="text-slate-200 font-medium">{CHI_SQUARE_DEVIATION_BIN_WIDTH}</span> 단위 구간마다 본번호
          한 개당 슬롯 1회씩 셉니다(같은 회차·같은 구간에 3개면 슬롯 3).
        </p>
        <p className="text-slate-400">
          <span className="text-slate-200 font-medium">조건부 확률(%)</span>은 그 구간이 나온 회차(분모) 중, 조회 회차
          당첨 본번호와 실제 번호가 겹친 회차(분자) 비율입니다. 즉,{' '}
          <span className="text-slate-200 font-medium">겹침 회차 / 출현 회차 × 100</span>입니다.
        </p>
        <p className="text-slate-400">
          출현 회차가 0인 구간은 표에서 생략합니다.
        </p>
        <p className="text-slate-400">
          슬롯 누적 합:{' '}
          <span className="font-semibold text-white tabular-nums">{denominator}</span>
          <span className="text-slate-500 ml-1">
            (목표 회차 {targetRoundCount}회, 첫 회차는 이전 누적이 없어 제외, 회차당 최대 6슬롯)
          </span>
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BinTable title="음의 구간 (−)" accentClass="text-rose-200" rows={negBins} />
        <BinTable title="양의 구간 (0 이상)" accentClass="text-sky-200" rows={posBins} />
      </div>
    </section>
  );
}
