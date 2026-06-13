import { useMemo } from 'react';
import { extractMainNumbers } from '../types/winRow';
import type { useFinalPickData } from './useFinalPickData';

type Data = ReturnType<typeof useFinalPickData>;

/** FinalPickMain 표시용 당첨 번호 하이라이트. */
export const useFinalPickView = (data: Data) => {
  const selectedMainNumbers = useMemo(
    () => (data.selectedWinningNumber ? extractMainNumbers(data.selectedWinningNumber) : []),
    [data.selectedWinningNumber],
  );
  const mainWinningNumberSet = useMemo(() => new Set(selectedMainNumbers), [selectedMainNumbers]);

  return {
    selectedMainNumbers,
    mainWinningNumberSet,
  };
};
