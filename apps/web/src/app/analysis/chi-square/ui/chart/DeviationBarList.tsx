import { CHART_HALF_H } from '../../constants';
import type { ChiSquareResult } from '../../types';

type Props = {
  items: ChiSquareResult[];
  maxAbsDeviation: number;
  selectedWinningNumberSet: Set<number> | null;
  walkForwardExcludedNumberSet: Set<number> | null;
};

export function DeviationBarList({
  items,
  maxAbsDeviation,
  selectedWinningNumberSet,
  walkForwardExcludedNumberSet,
}: Props) {
  return (
    <ul className="w-max flex gap-1">
      {items.map((item) => {
        const isWinningNum = selectedWinningNumberSet?.has(item.number) ?? false;
        const isWalkForwardExcluded = walkForwardExcludedNumberSet?.has(item.number) ?? false;
        const posBarPx =
          item.deviation > 0 ? Math.max((item.deviation / maxAbsDeviation) * CHART_HALF_H, 2) : 0;
        const negBarPx =
          item.deviation < 0 ? Math.max((Math.abs(item.deviation) / maxAbsDeviation) * CHART_HALF_H, 2) : 0;
        const posColor = isWinningNum ? 'bg-amber-400/90' : item.isHighFreq ? 'bg-blue-500/90' : 'bg-blue-400/50';
        const negColor = isWinningNum ? 'bg-amber-400/90' : item.isLowFreq ? 'bg-rose-500/90' : 'bg-rose-400/50';
        const numColor = isWinningNum ? 'text-amber-300 font-bold' : 'text-slate-300 font-medium';

        return (
          <li
            key={item.number}
            className={`w-8 shrink-0 flex flex-col items-center ${isWalkForwardExcluded ? 'rounded-b-sm pb-0.5 ring-1 ring-rose-400/70 ring-offset-1 ring-offset-slate-950' : ''}`}
          >
            <div className="relative w-full flex flex-col justify-end" style={{ height: CHART_HALF_H }}>
              {item.deviation > 0 && (
                <>
                  <span className="absolute bottom-full left-0 right-0 text-center text-[10px] text-slate-200 tabular-nums leading-none mb-0.5">
                    +{item.deviation.toFixed(1)}
                  </span>
                  <div className={`w-full rounded-t-sm ${posColor}`} style={{ height: posBarPx }} />
                </>
              )}
            </div>
            <div className={`w-full h-[2px] ${isWinningNum ? 'bg-amber-400/60' : 'bg-white/20'}`} />
            <div className="relative w-full flex flex-col justify-start" style={{ height: CHART_HALF_H }}>
              {item.deviation < 0 && (
                <>
                  <div className={`w-full rounded-b-sm ${negColor}`} style={{ height: negBarPx }} />
                  <span className="absolute top-full left-0 right-0 text-center text-[10px] text-slate-200 tabular-nums leading-none mt-0.5">
                    {item.deviation.toFixed(1)}
                  </span>
                </>
              )}
            </div>
            <span className={`text-[11px] leading-none mt-4 ${numColor}`}>{item.number}</span>
          </li>
        );
      })}
    </ul>
  );
}
