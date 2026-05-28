/** 당첨번호 대비 세트별 등수·집계 타입 */

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

/** 가져온 세트들을 입력한 당첨번호와 비교한 집계 결과 */
export interface RankStatsResult {
  canCalculate: boolean;
  totalSets: number;
  rankCounts: RankCounts;
  setRankings: SetRanking[];
}
