/**
 * 추천 생성에서 미추첨 간격 우선순위를 표현하는 타입입니다.
 *
 * 하는 일
 * - 현재 간격·최대 간격·둘의 거리로 RANK1~10 순위를 담습니다.
 * - 현재가 더 길면 최대를 갱신하므로 현재는 최대를 넘지 않습니다.
 *
 * 실패·주의
 * - 창 안에서 한 번도 안 나온 번호는 순위 하단으로 갑니다.
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
