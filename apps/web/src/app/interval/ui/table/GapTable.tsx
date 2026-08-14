import type { GapRow } from '../../types/interval';
import { GAP_HEADERS, GAP_HINT } from '../../constants/copy';
import { GapTableRows } from './GapTableRows';
import {
  formatStatsSampleDesc,
  STATS_WINDOW_ONE_YEAR,
  STATS_WINDOW_ONE_YEAR_LABEL,
} from '@/lib/statsWindow';

type Props = {
  totalDraws: number;
  rows: GapRow[];
};

export const GapTable = ({ totalDraws, rows }: Props) => (
  <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
    <div>
      <h3 className="text-xl font-semibold text-white">미추첨 간격</h3>
      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{GAP_HINT}</p>
    </div>
    <p className="text-[11px] text-slate-500">
      {formatStatsSampleDesc(STATS_WINDOW_ONE_YEAR_LABEL, STATS_WINDOW_ONE_YEAR, totalDraws)}
    </p>
    {totalDraws === 0 ? (
      <p className="text-sm text-slate-300">집계할 당첨 이력이 없습니다.</p>
    ) : (
      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-lg border border-card-border/20">
        <table className="w-full min-w-[480px] text-sm text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm">
            <tr className="border-b border-card-border/30">
              {GAP_HEADERS.map((header) => (
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
