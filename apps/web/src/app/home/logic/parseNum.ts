/**
 * 당첨번호·보너스 입력 칸에 사용자가 친 글자를, 칸에 저장할 값으로 바꿉니다.
 *
 * 하는 일
 * - 빈 칸이면 비어 있음('')으로 둡니다.
 * - 숫자로 읽을 수 있으면 그 정수를 칸 값으로 씁니다.
 * - 숫자가 아니면 비어 있음('')으로 둡니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 입력 칸에 적힌 글자(`string`)
 * - 돌려줌: 비어 있음 또는 숫자(`InputNumber`)
 *
 * 역할 나눔
 * - 입력 칸 상태를 기억하는 곳: `hooks/useWinInput.ts`
 * - 칸 값을 집계용 숫자로 바꾸는 곳: `logic/normalize.ts`의 `toNumOrNull`
 * - 1~45 범위가 맞는지 보는 곳: `types/win.ts`의 `isValidLottoNumber`
 *
 * 주의·화면에 미치는 영향
 * - 빈 칸·잘못된 입력은 `''`가 되어, 당첨 통계는 안내 문구만 보입니다.
 * - 앞부분만 숫자인 글자(예: "12a")는 앞의 정수(12)로 읽습니다(기존과 같음).
 */
import type { InputNumber } from '../types/home';

export const toInputNum = (value: string): InputNumber => {
  if (value === '') return '';
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? '' : parsed;
};
