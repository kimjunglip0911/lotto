// 연속 미출현 분석 화면이 공통으로 쓰는 데이터 형태를 모아 둔 파일입니다.
// 당첨번호 한 줄(WinningNumberRow), 번호별 분석 결과(StreakResult)와
// 응답이 올바른지 검사하는 가드(isWinningNumberRow)·집합 변환 헬퍼를 함께 둡니다.

export type WinningNumberRow = {
  draw_no: number;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus_num: number;
};

export type StreakResult = {
  number: number;
  lastDrawNo: number | null;
  streak: number;
  isCold: boolean;
};

/** 당첨 번호 6개 + 보너스를 조회·차트 하이라이트용 Set으로 변환한다. */
export const winningNumbersToSet = (row: WinningNumberRow): Set<number> =>
  new Set([row.num1, row.num2, row.num3, row.num4, row.num5, row.num6, row.bonus_num]);

export const isWinningNumberRow = (value: unknown): value is WinningNumberRow => {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<WinningNumberRow>;
  return (
    typeof c.draw_no === 'number' &&
    typeof c.num1 === 'number' &&
    typeof c.num2 === 'number' &&
    typeof c.num3 === 'number' &&
    typeof c.num4 === 'number' &&
    typeof c.num5 === 'number' &&
    typeof c.num6 === 'number' &&
    typeof c.bonus_num === 'number'
  );
};
