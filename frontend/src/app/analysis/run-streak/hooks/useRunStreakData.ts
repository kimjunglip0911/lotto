import { useMemo } from 'react';
import { getAverageStreak, getTop5PctThreshold } from '../logic/streak';
import { useDrawList } from './useDrawList';
import { useStreakSearch } from './useStreakSearch';

// 회차 목록 가져오기와 조회 동작을 한곳에 묶어 화면에 넘겨 주는 코드입니다.
// 두 개의 작은 훅(useDrawList, useStreakSearch)을 합치고 평균·상위 5% 값만 추가로 계산합니다.

export const useRunStreakData = () => {
  const drawList = useDrawList();
  const search = useStreakSearch(drawList.selectedDraw);

  const averageStreak = useMemo(() => getAverageStreak(search.streakResults), [search.streakResults]);
  const top5PctThreshold = useMemo(
    () => getTop5PctThreshold(search.streakResults),
    [search.streakResults],
  );

  return {
    ...drawList,
    ...search,
    averageStreak,
    top5PctThreshold,
  };
};
