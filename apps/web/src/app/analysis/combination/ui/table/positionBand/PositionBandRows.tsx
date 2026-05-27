import { positionGroupRowBg } from '../../../helpers/positionRowBg';
import type { PositionBandDistributionRow } from '../../../types';

type Props = {
  rows: PositionBandDistributionRow[];
};

export function PositionBandRows({ rows }: Props) {
  return (
    <>
      {rows.map((r, i) => {
        const isFirstInPosition = i === 0 || rows[i - 1].position !== r.position;
        const isLastInPosition = i === rows.length - 1 || rows[i + 1].position !== r.position;
        let rowSpan = 1;
        if (isFirstInPosition) {
          for (let j = i + 1; j < rows.length && rows[j].position === r.position; j++) {
            rowSpan++;
          }
        }
        const rowBg = positionGroupRowBg(r.position);
        const groupTopRule = isFirstInPosition && i > 0 ? 'border-t-2 border-slate-500/45' : '';
        const rowBottomRule = isLastInPosition
          ? 'border-b border-slate-500/35'
          : 'border-b border-white/[0.06]';

        return (
          <tr key={`${r.position}-${r.bandLabel}`} className={`${groupTopRule} ${rowBottomRule}`}>
            {isFirstInPosition ? (
              <td
                rowSpan={rowSpan}
                className={`py-1.5 px-3 text-slate-200 tabular-nums text-center align-middle border-r border-slate-500/30 ${rowBg}`}
              >
                {r.position}번째
              </td>
            ) : null}
            <td className={`py-1.5 px-3 text-slate-200 tabular-nums ${rowBg}`}>{r.bandLabel}</td>
            <td className={`py-1.5 px-3 text-right text-slate-300 tabular-nums ${rowBg}`}>
              {r.drawCount.toLocaleString()}
            </td>
            <td className={`py-1.5 px-3 text-right text-sky-300 tabular-nums ${rowBg}`}>
              {r.percentage.toFixed(2)}%
            </td>
          </tr>
        );
      })}
    </>
  );
}
