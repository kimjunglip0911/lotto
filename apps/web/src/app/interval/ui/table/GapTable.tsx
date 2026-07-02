import type { GapRow } from '../../types/interval';
import { GapTableRows } from './GapTableRows';

/**
 * 번호별 간격 통계를 표로 보여 주는 파일입니다.
 *
 * 하는 일
 * - 1~45번별 출현 회차와 다음 출현까지의 간격 통계를 한 표에 배치합니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 집계 회차 수와 번호별 표 행
 * - 돌려줌: 스크롤 가능한 통계 표
 */

type Props = {
  totalDraws: number;
  rows: GapRow[];
};

const HEADERS = ['번호', '출현 회차', '계산 간격', '평균', '최대'];

export const GapTable = ({ totalDraws, rows }: Props) => (
  <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
    <div>
      <h3 className="text-xl font-semibold text-white">번호별 간격</h3>
      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
        당첨 주번호 6개만 사용합니다. 연속 출현은 하나의 묶음으로 보고,
        묶음의 마지막 회차부터 다음 출현까지의 회차 차이만 평균·최대에 반영합니다.
      </p>
    </div>
    <p className="text-[11px] text-slate-500">집계 회차 {totalDraws.toLocaleString()}건</p>
    {totalDraws === 0 ? (
      <p className="text-sm text-slate-300">집계할 당첨 이력이 없습니다.</p>
    ) : (
      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-lg border border-card-border/20">
        <table className="w-full min-w-[640px] text-sm text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm">
            <tr className="border-b border-card-border/30">
              {HEADERS.map((header) => (
                <th key={header} scope="col" className="py-2 px-3 font-semibold text-slate-300">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <GapTableRows rows={rows} />
          </tbody>
        </table>
      </div>
    )}
  </section>
);
