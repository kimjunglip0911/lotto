import { useMemo } from 'react';
import { getAverageStreak } from '../logic/streak';
import { useDraws } from './useDraws';
import { useStFetch } from './useStFetch';

// 회차 목록 가져오기와 조회 동작을 한곳에 묶어 화면에 넘겨 주는 코드입니다.
// 두 개의 작은 훅(useDraws, useStFetch)을 합치고 평균값만 추가로 계산합니다.

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
