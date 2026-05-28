/**
 * 가져온 분석 세트마다, 입력한 당첨번호와 맞는지 등수를 집계합니다.
 *
 * 하는 일
 * - 세트별로 당첨 번호·보너스와 몇 개 맞는지 보고 1~5등·낙첨을 센다.
 * - 등수별 건수와 세트 번호 목록을 만들어 통계 패널에 넘긴다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 표시용 세트 목록, 당첨번호 6칸, 보너스 한 칸
 * - 돌려줌: 집계 가능 여부·총 세트 수·등수별 건수·세트별 등수 목록(`RankStatsResult`)
 *
 * 역할 나눔
 * - 당첨번호 입력 정리: `logic/normalize.ts`
 * - 한 세트 등수 판정: `logic/rankSet.ts`
 * - 결과 표시: `ui/stats/RankStats.tsx`
 */
import { INITIAL_RANK_COUNTS } from '../constants/home';
import type {
  InputNumber,
  LotterySetViewModel,
  RankCounts,
  RankStatsResult,
  SetRanking,
} from '../types/home';
import { canCalcWins, toNumOrNull, toWinNums } from './normalize';
import { rankOneSet } from './rankSet';

const createRankCounts = (): RankCounts => ({ ...INITIAL_RANK_COUNTS });

const sortSetRankings = (setRankings: SetRanking[]): void => {
  setRankings.sort((left, right) => {
    if (left.rank !== right.rank) return left.rank - right.rank;
    return left.setNumber - right.setNumber;
  });
};

export const calcRankStats = (
  sets: LotterySetViewModel[],
  winningNumbers: InputNumber[],
  bonusNumber: InputNumber,
): RankStatsResult | null => {
  if (!sets || sets.length === 0) return null;

  const rankCounts = createRankCounts();
  const setRankings: SetRanking[] = [];
  const normalized = toWinNums(winningNumbers);
  const canCalculate = canCalcWins(normalized);

  if (!canCalculate) {
    return { canCalculate, totalSets: sets.length, rankCounts, setRankings };
  }

  const winningSet = new Set<number>(normalized);
  const bonus = toNumOrNull(bonusNumber);
  sets.forEach((setInfo, index) => rankOneSet(setInfo, index, winningSet, bonus, rankCounts, setRankings));
  sortSetRankings(setRankings);

  return { canCalculate, totalSets: sets.length, rankCounts, setRankings };
};
