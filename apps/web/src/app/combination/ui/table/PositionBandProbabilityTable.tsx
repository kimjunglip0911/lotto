import { useMemo } from 'react';
import { formatStatsSampleDesc } from '@/lib/statsWindow';
import { TOP_BAND_RANK } from '../../constants/topRank';
import { rankPositionBandRows } from '../../logic/rankPositionBands';
import { takeTopRanks } from '../../logic/topRanks';
import type { PositionBandDistributionRow } from '../../types';
import { BandHead } from './bandHead';
import { PositionBandRows } from './positionBand/PositionBandRows';

type Props = {
  label: string;
  windowSize: number | null;
  totalDraws: number;
  rows: PositionBandDistributionRow[];
};

/** 기간별 주6 자리 번호대 비율. 화면은 10등까지 보여 준다. */
export function PositionBandProbabilityTable({ label, windowSize, totalDraws, rows }: Props) {
  const rankedRows = useMemo(() => takeTopRanks(rankPositionBandRows(rows)), [rows]);
  const size = windowSize ?? Number.POSITIVE_INFINITY;
  const recommend =
    windowSize == null ? ' 추천 생성 시 자리별 1등부터 순서대로 번호대를 우선 사용합니다.' : '';

  return (
    <section className="min-w-0 rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <div>
        <h3 className="text-xl font-semibold text-white">구간별 번호 확률 · {label}</h3>
        <p className="text-xs text-slate-400 mt-1">
          표본: {formatStatsSampleDesc(label, size, totalDraws)} 당첨 주번호 6개(num1~num6)만
          사용합니다. 보너스 번호는 제외합니다. 번호구간은 번호 1개 단위(1~45)로 집계합니다. 각
          행의 비율은 해당 구간(자리) 안에서만 합산하여 100%입니다. 각 자리 {TOP_BAND_RANK}등까지만
          표시합니다.{recommend}
        </p>
      </div>
      <p className="text-[11px] text-slate-500">집계 회차 {totalDraws.toLocaleString()}건</p>
      {totalDraws === 0 ? (
        <p className="text-sm text-slate-300">집계할 당첨 이력이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] rounded-lg border border-card-border/20">
          <table className="w-full whitespace-nowrap text-xs text-left border-collapse">
            <BandHead />
            <tbody>
              <PositionBandRows rows={rankedRows} />
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
