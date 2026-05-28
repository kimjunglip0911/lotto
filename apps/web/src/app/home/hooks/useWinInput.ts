/**
 * 홈 화면 당첨번호·보너스 입력 칸의 값을 다루는 훅입니다.
 *
 * 하는 일
 * - 사용자가 칸에 입력한 번호를 기억합니다.
 * - 선택한 회차의 저장된 당첨 데이터가 바뀌면 입력 칸을 그에 맞게 채우거나 비웁니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: `winByDraw` — 현재 회차의 당첨 데이터(없으면 null)
 * - 돌려줌: `winningNumbers`, `winningBonus`, `onWinNumChg`, `onBonusChg`
 *
 * 역할 나눔
 * - 회차·당첨 조회: `hooks/useGridData.ts`, `hooks/useDrawBundle.ts`
 * - 입력·저장·화면 조합: `hooks/useHomeView.ts`
 * - 저장 요청: `hooks/useSaveWinning.ts`
 *
 * 실패·주의
 * - 당첨 데이터가 없으면 입력 칸은 빈 값으로 초기화됩니다.
 * - 회차를 바꾸면 `winByDraw`가 바뀌며 입력 칸이 다시 맞춰집니다(사용자가 쓰던 값은 덮어씁니다).
 */

import { useCallback, useState } from 'react';

import { EMPTY_BONUS, EMPTY_WINNING_NUMBERS } from '../constants/home';
import { toInputNum } from '../logic/parseNum';
import type { InputNumber, WinningNumbersByDraw } from '../types/home';

const numsFromWin = (data: WinningNumbersByDraw): InputNumber[] => [
  data.num1,
  data.num2,
  data.num3,
  data.num4,
  data.num5,
  data.num6,
];

export const useWinInput = (winByDraw: WinningNumbersByDraw | null) => {
  const [winningNumbers, setWinningNumbers] = useState<InputNumber[]>(EMPTY_WINNING_NUMBERS);
  const [winningBonus, setWinningBonus] = useState<InputNumber>(EMPTY_BONUS);
  const [lastWinByDraw, setLastWinByDraw] = useState(winByDraw);

  if (winByDraw !== lastWinByDraw) {
    setLastWinByDraw(winByDraw);
    if (!winByDraw) {
      setWinningNumbers(EMPTY_WINNING_NUMBERS);
      setWinningBonus(EMPTY_BONUS);
    } else {
      setWinningNumbers(numsFromWin(winByDraw));
      setWinningBonus(winByDraw.bonus_num);
    }
  }

  const onWinNumChg = useCallback((index: number, value: string) => {
    const parsedNumber = toInputNum(value);
    setWinningNumbers((prev) => {
      const next = [...prev];
      next[index] = parsedNumber;
      return next;
    });
  }, []);

  const onBonusChg = useCallback((value: string) => {
    setWinningBonus(toInputNum(value));
  }, []);

  return {
    winningNumbers,
    winningBonus,
    onWinNumChg,
    onBonusChg,
  };
};
