import { useMemo } from 'react';
import { getAverageStreak } from '../logic/streak/streak';
import { useDraws } from './useDraws';
import { useStFetch } from './useStFetch';

// 회차 목록과 조회 결과를 한데 묶고, 표에 쓰는 평균 연속 길이만 여기서 더합니다.

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
