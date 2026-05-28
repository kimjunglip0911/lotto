/**
 * 서버에서 받은 회차 목록 답을 **숫자 배열**로만 골라 내는 도구입니다.
 *
 * 하는 일
 * - 목록 형태가 아니거나, 정수 회차가 하나도 없으면 “쓸 수 없음”(null)으로 돌려줍니다.
 * - 정수만 남긴 배열을 돌려줍니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 서버 답 전체(형태를 모를 때)
 * - 돌려줌: 정수 회차 배열, 또는 null
 *
 * 역할 나눔
 * - 실제 서버 요청은 `api/draw/drawNums.ts`가 담당합니다.
 * - “첫 회차+1”처럼 화면용 목록으로 바꾸는 일은 `logic/buildDrawList.ts`가 담당합니다.
 *
 * 주의·화면에 미치는 영향
 * - 오류를 밖으로 던지지 않고 null만 돌려, 홈 화면이 멈추지 않게 합니다.
 */

export const parseDrawNumArr = (data: unknown): number[] | null => {
  if (!Array.isArray(data)) return null;
  const drawNumbers = data.filter((value): value is number =>
    Number.isInteger(value),
  );
  return drawNumbers.length === 0 ? null : drawNumbers;
};
