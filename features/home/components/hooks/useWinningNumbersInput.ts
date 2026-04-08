import { useCallback, useState } from 'react';

export type InputNumber = number | '';

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

  return {
    winningNumbers,
    winningBonus,
    handleWinningNumberChange,
    handleBonusNumberChange,
    resetWinningInputs,
  };
};
