import { formatGap } from '../../helpers/formatGap';
import type { GapRow } from '../../types/interval';

type Props = {
  rows: GapRow[];
};

export const GapTableRows = ({ rows }: Props) => (
  <>
    {rows.map((row) => (
      <tr key={row.number} className="border-b border-white/[0.06] hover:bg-white/[0.03]">
        <td className="py-2 px-3 text-left text-slate-200 tabular-nums">{row.rank}</td>
        <td className="py-2 px-3 text-left text-sky-200 font-semibold tabular-nums">
          {row.number}
        </td>
        <td className="py-2 px-3 text-left text-slate-200 tabular-nums">
          {formatGap(row.currentGap)}
        </td>
        <td className="py-2 px-3 text-left text-slate-200 tabular-nums">
          {formatGap(row.maxGap)}
        </td>
      </tr>
    ))}
  </>
);
