import { useCallback, useState } from 'react';
import type { InputNumber, WinningNumbersByDraw } from '@/app/home/components/types';

const EMPTY_WINNING_NUMBERS: InputNumber[] = Array(6).fill('');
const EMPTY_BONUS: InputNumber = '';

export const useWinningNumbersInput = () => {
  const [winningNumbers, setWinningNumbers] = useState<InputNumber[]>(EMPTY_WINNING_NUMBERS);
  const [winningBonus, setWinningBonus] = useState<InputNumber>('');

  const parseInputNumber = useCallback((value: string): InputNumber => {
    if (value === '') return '';
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? '' : parsed;
  }, []);

  const handleWinningNumberChange = useCallback((index: number, value: string) => {
    const parsedNumber = parseInputNumber(value);
    setWinningNumbers((prev) => {
      const next = [...prev];
      next[index] = parsedNumber;
      return next;
    });
  }, [parseInputNumber]);

  const handleBonusNumberChange = useCallback((value: string) => {
    setWinningBonus(parseInputNumber(value));
  }, [parseInputNumber]);

  const resetWinningInputs = useCallback(() => {
    setWinningNumbers(EMPTY_WINNING_NUMBERS);
    setWinningBonus(EMPTY_BONUS);
  }, []);

  const applyWinningNumbers = useCallback((numbers: InputNumber[], bonus: InputNumber) => {
    setWinningNumbers(numbers);
    setWinningBonus(bonus);
  }, []);

  const setWinningNumbersFromDraw = useCallback((data: WinningNumbersByDraw | null) => {
    if (!data) {
      applyWinningNumbers(EMPTY_WINNING_NUMBERS, EMPTY_BONUS);
      return;
    }
    applyWinningNumbers([data.num1, data.num2, data.num3, data.num4, data.num5, data.num6], data.bonus_num);
  }, [applyWinningNumbers]);

  return {
    winningNumbers,
    winningBonus,
    handleWinningNumberChange,
    handleBonusNumberChange,
    resetWinningInputs,
    setWinningNumbersFromDraw,
  };
};
