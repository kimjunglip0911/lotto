// 로또 본번호가 쓰이는 범위(1~45)를 정해 두고, 숫자가 그 안에 드는지 판별합니다.

export const TOTAL_NUMBERS = 45;
export const WINNING_NUMBER_MIN = 1;

export const isValidLotteryNumber = (n: number): boolean =>
  n >= WINNING_NUMBER_MIN && n <= TOTAL_NUMBERS;
