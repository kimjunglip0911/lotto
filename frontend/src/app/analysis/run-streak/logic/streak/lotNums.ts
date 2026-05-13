// 로또 본번호가 쓰이는 범위(1~45)를 정해 두고, 숫자가 그 안에 드는지 판별합니다.
// 연속 출현 계산과 직전 두 회차 교집합 계산이 같은 규칙을 쓰도록 한곳에 모았습니다.

export const TOTAL_NUMBERS = 45;
export const WINNING_NUMBER_MIN = 1;

export const isValidLotteryNumber = (n: number): boolean =>
  n >= WINNING_NUMBER_MIN && n <= TOTAL_NUMBERS;
