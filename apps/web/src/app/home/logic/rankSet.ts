/**
 * 분석 번호 한 세트를 당첨번호와 비교해, 등수 집계판에 반영합니다.
 *
 * 하는 일
 * - 세트 안 숫자들을 집계에 쓸 수 있는 숫자로 정리합니다.
 * - 당첨번호와 몇 개 맞는지, 보너스 번호가 맞는지 계산합니다.
 * - 계산된 등수를 등수별 카운트와 세트별 결과 목록에 기록합니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 세트 정보, 세트 순번, 당첨번호 묶음, 보너스 번호, 누적 카운트, 세트별 등수 목록
 * - 돌려줌: 없음(`void`). 대신 전달받은 집계 객체를 바로 갱신합니다.
 *
 * 역할 나눔
 * - 등수 규칙 자체는 `logic/rank.ts`의 `getRank`가 담당합니다.
 * - 여러 세트를 순회하며 이 함수를 호출하는 일은 `logic/rankStats.ts`가 담당합니다.
 *
 * 주의·화면에 미치는 영향
 * - 숫자로 읽을 수 없는 값은 비교 대상에서 제외됩니다.
 * - 등수가 없으면 낙첨(`fail`) 카운트가 1 증가해 통계 패널 낙첨 수에 반영됩니다.
 */

import type { LotterySetViewModel, RankCounts, SetRanking } from '../types/home';
import { getRank } from './rank';

const toSetNums = (numbers: number[]): number[] =>
  numbers.map((value) => Number.parseInt(String(value), 10)).filter((value) => !Number.isNaN(value));

const countMatches = (setNums: number[], winSet: Set<number>): number =>
  setNums.reduce((count, value) => count + (winSet.has(value) ? 1 : 0), 0);

const pushRank = (
  rank: ReturnType<typeof getRank>,
  setNo: number,
  rankCounts: RankCounts,
  setRanks: SetRanking[],
): void => {
  if (!rank) {
    rankCounts.fail += 1;
    return;
  }

  rankCounts[rank] += 1;
  setRanks.push({ setNumber: setNo, rank });
};

export const rankOneSet = (
  setInfo: LotterySetViewModel,
  index: number,
  winSet: Set<number>,
  bonus: number | null,
  rankCounts: RankCounts,
  setRanks: SetRanking[],
): void => {
  const setNo = index + 1;
  const setNums = toSetNums(setInfo.numbers);
  const matchCount = countMatches(setNums, winSet);
  const isBonusMatched = bonus !== null && setNums.includes(bonus);
  const rank = getRank(matchCount, isBonusMatched);
  pushRank(rank, setNo, rankCounts, setRanks);
};
