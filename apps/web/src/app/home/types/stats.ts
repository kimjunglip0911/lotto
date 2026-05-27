/** 시뮬레이션 통계·등수 타입 */

export type Rank = 1 | 2 | 3 | 4 | 5;

export interface SetRanking {
  setNumber: number;
  rank: Rank;
}

export interface RankCounts {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  fail: number;
}

export interface SimulationStatsResult {
  canCalculate: boolean;
  totalSets: number;
  rankCounts: RankCounts;
  setRankings: SetRanking[];
}
