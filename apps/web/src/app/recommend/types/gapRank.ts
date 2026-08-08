/**
 * 추천 생성에서 번호별 간격 우선순위를 표현하는 타입입니다.
 *
 * 하는 일
 * - 현재 간격·과거 최대 간격·둘의 거리로 RANK1~10 순위를 담습니다.
 * - 최대를 넘긴 번호가 위, 최대에 가까운 번호가 그다음입니다.
 *
 * 실패·주의
 * - 최대 간격을 만들 이력이 없는 번호는 순위 하단으로 갑니다.
 */

export type GapRankRow = {
  number: number;
  draws: number[];
  currentGap: number | null;
  avgGap: number | null;
  maxGap: number | null;
  distance: number | null;
  rank: number;
};

export type GapRankLookup = ReadonlyMap<number, GapRankRow>;
