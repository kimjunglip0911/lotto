import type { DeviationBinRow } from '../../logic/walkForwardStats';

type Props = { title: string; accentClass: string; rows: DeviationBinRow[] };

export function WfBinTable({ title, accentClass, rows }: Props) {
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
