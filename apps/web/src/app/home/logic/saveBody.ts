/**
 * 화면에서 입력한 당첨번호를 서버 저장 형식으로 바꾸는 파일입니다.
 *
 * 하는 일
 * - 회차, 당첨번호 6개, 보너스 번호를 서버가 받는 키 이름으로 묶습니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 선택 회차와 입력 번호(빈칸일 수 있는 값 포함)
 * - 돌려줌: 저장 요청 본문(`SaveWinBody`)
 *
 * 역할 나눔
 * - 실제 저장 요청 전송은 `api/win/saveWin.ts`가 맡습니다.
 * - 저장 버튼 동작 제어는 `hooks/useSaveWinning.ts`가 맡습니다.
 *
 * 주의
 * - 번호에 빈칸이 남아 있으면 에러를 던져 저장 단계에서 실패 처리되도록 합니다.
 */

import type { InputNumber, SaveWinBody } from '../types/home';

const toNum = (value: InputNumber): number => {
  if (typeof value !== 'number') throw new Error('Invalid lotto number');
  return value;
};

export const makeSaveBody = (
  selectedDraw: number,
  winningNumbers: InputNumber[],
  winningBonus: InputNumber,
): SaveWinBody => {
  const [num1, num2, num3, num4, num5, num6] = winningNumbers;

  return {
    draw_no: selectedDraw,
    num1: toNum(num1),
    num2: toNum(num2),
    num3: toNum(num3),
    num4: toNum(num4),
    num5: toNum(num5),
    num6: toNum(num6),
    bonus_num: toNum(winningBonus),
  };
};
