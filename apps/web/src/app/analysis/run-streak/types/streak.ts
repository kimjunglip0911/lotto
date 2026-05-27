/** 번호별 연속 출현 분석 결과 한 줄. */
export type StreakResult = {
  /** 1~45 본번호 */
  number: number;
  /** 연속 구간의 가장 오래된(시작) 회차; streak이 0이면 null(1회만 출현 포함) */
  lastDrawNo: number | null;
  /** 연속으로 나온 회차 수 − 1 (직전 1회만 본번호 출현 → 0, 2회 연속 → 1) */
  streak: number;
  /** 연속 출현 길이가 전체 평균보다 김 */
  isCold: boolean;
};
