import { useMemo } from 'react';
import { getAverageStreak } from '../logic/streak/streak';
import { useDraws } from './useDraws';
import { useStFetch } from './useStFetch';

export const useStData = () => {
  const draws = useDraws();
  const search = useStFetch(draws.selectedDraw);

  const averageStreak = useMemo(
    () => getAverageStreak(search.streakResults),
    [search.streakResults],
  );

  return {
    ...draws,
    ...search,
    averageStreak,
  };
};

export type StreakData = ReturnType<typeof useStData>;
