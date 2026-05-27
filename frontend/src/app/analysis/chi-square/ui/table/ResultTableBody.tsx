import type { ChiSquareResult } from '../../types';

type Props = {
  rows: ChiSquareResult[];
  walkForwardExcludedNumberSet: Set<number> | null;
};

export function ResultTableBody({ rows, walkForwardExcludedNumberSet }: Props) {
  return (
    <tbody>
      {rows.map((row) => {
        const isWalkForwardExcluded = walkForwardExcludedNumberSet?.has(row.number) ?? false;
        return (
          <tr
            key={row.number}
            className={`border-b border-white/5 transition-colors ${
              row.isLowFreq
                ? 'bg-rose-500/10 hover:bg-rose-500/15'
                : row.isHighFreq
                  ? 'bg-blue-500/10 hover:bg-blue-500/15'
                  : 'hover:bg-white/3'
            }`}
          >
            <td className="py-2 pr-3">
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  row.isLowFreq
                    ? 'bg-rose-500/30 text-rose-200'
                    : row.isHighFreq
                      ? 'bg-blue-500/30 text-blue-200'
                      : 'bg-white/10 text-white'
                } ${isWalkForwardExcluded ? 'ring-2 ring-rose-400/85 ring-offset-1 ring-offset-slate-900' : ''}`}
              >
                {row.number}
              </span>
            </td>
            <td className="py-2 pr-3 text-right tabular-nums text-white font-medium">{row.observed}</td>
            <td className="py-2 pr-3 text-right tabular-nums text-slate-400">{row.expected.toFixed(2)}</td>
            <td
              className={`py-2 pr-3 text-right tabular-nums font-medium ${row.deviation < 0 ? 'text-rose-300' : row.deviation > 0 ? 'text-blue-300' : 'text-slate-400'}`}
            >
              {row.deviation > 0 ? '+' : ''}
              {row.deviation.toFixed(2)}
            </td>
            <td className="py-2 pr-3 text-right tabular-nums text-slate-300">{row.chiSquare.toFixed(4)}</td>
            <td className="py-2 text-center">
              {row.isLowFreq ? (
                <span className="text-xs font-semibold text-rose-300 bg-rose-500/20 rounded-md px-2 py-0.5">저빈도</span>
              ) : row.isHighFreq ? (
                <span className="text-xs font-semibold text-blue-300 bg-blue-500/20 rounded-md px-2 py-0.5">고빈도</span>
              ) : (
                <span className="text-xs text-slate-500">-</span>
              )}
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}
