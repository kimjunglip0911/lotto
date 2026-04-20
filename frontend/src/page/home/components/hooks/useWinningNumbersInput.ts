import { useCallback, useState } from 'react';

export type InputNumber = number | '';
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
  const [winningNumbers, setWinningNumbers] = useState<InputNumber[]>(Array(6).fill(''));
  const [winningBonus, setWinningBonus] = useState<InputNumber>('');

  const handleWinningNumberChange = useCallback((index: number, value: string) => {
    const parsedNumber: InputNumber = value === '' ? '' : parseInt(value, 10) || 0;
    setWinningNumbers((prev) => {
      const next = [...prev];
      next[index] = parsedNumber;
      return next;
    });
  }, []);

  const handleBonusNumberChange = useCallback((value: string) => {
    const parsedNumber: InputNumber = value === '' ? '' : parseInt(value, 10) || 0;
    setWinningBonus(parsedNumber);
  }, []);

  const resetWinningInputs = useCallback(() => {
    setWinningNumbers(Array(6).fill(''));
    setWinningBonus('');
  }, []);

  const setWinningNumbersFromDraw = useCallback((data: WinningNumbersSource | null) => {
    if (!data) {
      setWinningNumbers(Array(6).fill(''));
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

