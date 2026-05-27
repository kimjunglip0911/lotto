import type { PositionBandDistributionRow } from '../../types';
import { PositionBandRows } from './positionBand/PositionBandRows';

type Props = {
  totalDraws: number;
  rows: PositionBandDistributionRow[];
};

/** 저장된 전체 당첨 이력 기준, 정렬된 주6 각 자리별 번호대 출현 회차 수·비율(%) 표 */
export function PositionBandProbabilityTable({ totalDraws, rows }: Props) {
  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <div>
        <h3 className="text-xl font-semibold text-white">구간별 번호 확률</h3>
        <p className="text-xs text-slate-400 mt-1">
          표본: DB에 저장된 전체 회차의 당첨 주번호 6개(num1~num6)만 사용합니다. 보너스 번호는 제외합니다.
          번호구간은 5개 번호 단위(1~5, 6~10, …, 41~45)로 집계합니다.
          각 행의 비율은 해당 구간(자리) 안에서만 합산하여 100%입니다.
        </p>
      </div>

      <p className="text-[11px] text-slate-500">집계 회차 {totalDraws.toLocaleString()}건</p>

      {totalDraws === 0 ? (
        <p className="text-sm text-slate-300">집계할 당첨 이력이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-card-border/20">
          <table className="w-full min-w-[360px] text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-card-border/30 bg-black/20">
                <th
                  scope="col"
                  className="py-2 px-3 font-semibold text-slate-300 text-center align-middle"
                >
                  구간
                </th>
                <th scope="col" className="py-2 px-3 font-semibold text-slate-300">
                  번호구간
                </th>
                <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-right">
                  총 회차
                </th>
                <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-right">
                  비율 (%)
                </th>
              </tr>
            </thead>
            <tbody>
              <PositionBandRows rows={rows} />
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
