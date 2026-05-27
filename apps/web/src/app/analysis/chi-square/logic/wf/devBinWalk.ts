import { TOTAL_NUMBERS } from '../../constants';
import type { WinningNumberRow } from '../../types';
import { addRowToCounts, mainSix } from '../rowCounts';
import { buildChiSquareResultsFromCounts } from './buildFromCounts';
import { deviationToBinKey, labelForDeviationBinKey, orderedDeviationBinKeys } from './devBinKeys';
import type { DeviationBinRow, DeviationBinWalkForwardSummary, RunChiSquareWalkForwardOptions } from './types';

export const runChiSquareDeviationBinWalkForward = (
  sortedRows: WinningNumberRow[],
  options?: RunChiSquareWalkForwardOptions,
): DeviationBinWalkForwardSummary => {
  const minPastDraws = options?.minPastDraws ?? 1;
  const referenceMainNumbers = options?.referenceMainNumbers;
  const hasRef = referenceMainNumbers !== undefined && referenceMainNumbers.size > 0;
  const rows = [...sortedRows].sort((a, b) => a.draw_no - b.draw_no);
  const counts = Array.from({ length: TOTAL_NUMBERS }, () => 0);
  const keys = orderedDeviationBinKeys();
  const hitMap = new Map(keys.map((k) => [k, 0]));
  const roundPresenceMap = new Map(keys.map((k) => [k, 0]));
  const roundMatchedMap = new Map(keys.map((k) => [k, 0]));
  let classifiedSlotCount = 0;
  let targetRoundCount = 0;

  for (let i = 0; i < rows.length; i++) {
    if (i >= minPastDraws) {
      targetRoundCount += 1;
      const results = buildChiSquareResultsFromCounts(counts, i);
      const resultsByNumber = new Map(results.map((r) => [r.number, r]));
      const binsThisRound = new Set<string>();
      const matchedBinsThisRound = new Set<string>();
      for (const num of mainSix(rows[i])) {
        const r = resultsByNumber.get(num);
        if (!r) continue;
        const binKey = deviationToBinKey(r.deviation);
        hitMap.set(binKey, (hitMap.get(binKey) ?? 0) + 1);
        classifiedSlotCount += 1;
        binsThisRound.add(binKey);
        if (hasRef && referenceMainNumbers.has(num)) matchedBinsThisRound.add(binKey);
      }
      for (const k of binsThisRound) roundPresenceMap.set(k, (roundPresenceMap.get(k) ?? 0) + 1);
      for (const k of matchedBinsThisRound) roundMatchedMap.set(k, (roundMatchedMap.get(k) ?? 0) + 1);
    }
    addRowToCounts(rows[i], counts);
  }

  const roundPct = (roundsHit: number, roundsMatched: number) =>
    roundsHit > 0 ? (roundsMatched / roundsHit) * 100 : 0;
  const allBins: DeviationBinRow[] = keys.map((binKey) => {
    const roundsHit = roundPresenceMap.get(binKey) ?? 0;
    const roundsMatched = roundMatchedMap.get(binKey) ?? 0;
    return {
      binKey,
      label: labelForDeviationBinKey(binKey),
      hits: hitMap.get(binKey) ?? 0,
      roundsHit,
      roundsMatched,
      pct: roundPct(roundsHit, roundsMatched),
    };
  });
  return {
    denominator: classifiedSlotCount,
    targetRoundCount,
    bins: allBins.filter((row) => row.roundsHit > 0),
    allBins,
  };
};
