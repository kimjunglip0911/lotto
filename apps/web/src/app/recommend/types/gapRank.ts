/**
 * 추천 생성에서 번호별 간격 우선순위를 표현하는 타입입니다.
 *
 * 하는 일
 * - 번호가 마지막으로 나온 뒤 기준 회차까지 얼마나 비었는지와 평균 간격 차이를 담습니다.
 * - 추천 후보 정렬은 이 값을 보고 평균 간격에 가까운 번호를 먼저 고릅니다.
 *
 * 실패·주의
 * - 평균을 계산할 이력이 부족한 번호는 순위 계산에서 뒤로 밀릴 수 있습니다.
 */

export type GapRankRow = {
  number: number;
  draws: number[];
  currentGap: number | null;
  avgGap: number | null;
  distance: number | null;
  rank: number;
};

export type GapRankLookup = ReadonlyMap<number, GapRankRow>;
