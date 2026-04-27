import { useCallback, useState } from 'react';

export type InputNumber = number | '';
const EMPTY_WINNING_NUMBERS: InputNumber[] = Array(6).fill('');

interface WinningNumbersSource {
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus_num: number;
}

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
    setWinningBonus('');
  }, []);

  const setWinningNumbersFromDraw = useCallback((data: WinningNumbersSource | null) => {
    if (!data) {
      setWinningNumbers(EMPTY_WINNING_NUMBERS);
      setWinningBonus('');
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
    resetWinningInputs,
    setWinningNumbersFromDraw,
  };
};

