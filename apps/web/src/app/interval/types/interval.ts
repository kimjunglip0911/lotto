/**
 * 미추첨 간격 표에서 한 줄을 표현하는 타입입니다.
 *
 * 하는 일
 * - 순위·번호·현재 미추첨 기간·과거 최대 간격을 담습니다.
 *
 * 실패·주의
 * - 간격을 못 만들면 미추첨 기간·최대는 비어 있는 값입니다.
 */

export type GapRow = {
  rank: number;
  number: number;
  currentGap: number | null;
  maxGap: number | null;
};
