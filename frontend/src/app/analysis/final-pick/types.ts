/**
 * 통합 분석(`final-pick`) 페이지 내부에서 사용하는 타입 모음.
 *
 * - 회차/당첨번호는 기존 `absence-streak` 라우터를 재사용해 가져오므로
 *   응답 형식은 다른 분석 페이지와 동일한 `WinningNumberRow`이다.
 */

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

/** 본번호 6개만 추출(보너스 제외). 통합 분석은 보너스를 표시하지 않는다. */
export const extractMainNumbers = (row: WinningNumberRow): number[] => [
  row.num1,
  row.num2,
  row.num3,
  row.num4,
  row.num5,
  row.num6,
];

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
