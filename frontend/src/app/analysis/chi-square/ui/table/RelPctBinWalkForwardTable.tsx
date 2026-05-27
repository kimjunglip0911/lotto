import { CHI_SQUARE_DEVIATION_BIN_WIDTH } from '../../constants';
import type { ChiSquareView } from '../../hooks/useChiSquareDerived';
import { WfBinTable } from './WfBinTable';

type Props = { view: ChiSquareView };

export function RelPctBinWalkForwardTable({ view }: Props) {
  const pres = view.relPctBinWalkForwardPresentation;
  if (!pres) return null;

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <h3 className="text-xl font-semibold text-white">
        구간별 분류 (편차 O−E, {CHI_SQUARE_DEVIATION_BIN_WIDTH} 단위)
      </h3>
      <div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 space-y-2 text-xs text-slate-300 leading-relaxed">
        <p className="text-slate-400">
          집계 구간: 조회 회차 <span className="text-slate-200 font-medium">직전까지 전체</span> 당첨 데이터를
          사용합니다.
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
        <p className="text-slate-400">출현 회차가 0인 구간은 표에서 생략합니다.</p>
        <p className="text-slate-400">
          슬롯 누적 합: <span className="font-semibold text-white tabular-nums">{pres.denominator}</span>
          <span className="text-slate-500 ml-1">
            (목표 회차 {pres.targetRoundCount}회, 첫 회차는 이전 누적이 없어 제외, 회차당 최대 6슬롯)
          </span>
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WfBinTable title="음의 구간 (−)" accentClass="text-rose-200" rows={pres.negBins} />
        <WfBinTable title="양의 구간 (0 이상)" accentClass="text-sky-200" rows={pres.posBins} />
      </div>
    </section>
  );
}
