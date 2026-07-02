/**
 * 번호별 간격 표에서 한 줄을 표현하는 타입입니다.
 *
 * 하는 일
 * - 1~45번 각각의 출현 회차와 다음 출현까지의 간격 통계를 담습니다.
 *
 * 무엇을 담는지
 * - 번호, 나온 회차 목록, 계산에 사용한 간격 목록, 평균·최대 간격입니다.
 *
 * 실패·주의
 * - 다음 출현까지 계산할 간격이 없으면 통계 값은 비어 있는 값으로 둡니다.
 */

export type GapRow = {
  number: number;
  draws: number[];
  gaps: number[];
  avgGap: number | null;
  maxGap: number | null;
};
