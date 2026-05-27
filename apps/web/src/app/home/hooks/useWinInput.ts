/** 당첨번호·보너스 입력 상태를 관리한다 */

import { useCallback, useState } from 'react';

import { EMPTY_BONUS, EMPTY_WINNING_NUMBERS } from '../constants/home';
import { parseInputNumber } from '../logic/parseNum';
import type { InputNumber, WinningNumbersByDraw } from '../types/home';

export const useWinInput = () => {
  const [winningNumbers, setWinningNumbers] = useState<InputNumber[]>(EMPTY_WINNING_NUMBERS);
  const [winningBonus, setWinningBonus] = useState<InputNumber>(EMPTY_BONUS);

  const handleWinningNumberChange = useCallback((index: number, value: string) => {
    const parsedNumber = parseInputNumber(value);
    setWinningNumbers((prev) => {
      const next = [...prev];
      next[index] = parsedNumber;
      return next;
    });
  }, []);

  const handleBonusNumberChange = useCallback((value: string) => {
    setWinningBonus(parseInputNumber(value));
  }, []);

  const setWinningNumbersFromDraw = useCallback((data: WinningNumbersByDraw | null) => {
    if (!data) {
      setWinningNumbers(EMPTY_WINNING_NUMBERS);
      setWinningBonus(EMPTY_BONUS);
      return;
    }
    setWinningNumbers([data.num1, data.num2, data.num3, data.num4, data.num5, data.num6]);
    setWinningBonus(data.bonus_num);
  }, []);

  return {
    winningNumbers,
    winningBonus,
    handleWinningNumberChange,
    handleBonusNumberChange,
    setWinningNumbersFromDraw,
  };
};
