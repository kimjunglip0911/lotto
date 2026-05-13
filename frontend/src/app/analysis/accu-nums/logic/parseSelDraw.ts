/** 화면에서 고른 회차 문자열이 1 이상의 정수면 그 숫자로, 아니면 실패(null)로 바꾼다. */

export const parseSelDraw = (selectedDraw: string): number | null => {
  const n = Number(selectedDraw);
  if (!Number.isInteger(n) || n < 1) {
    return null;
  }
  return n;
};
