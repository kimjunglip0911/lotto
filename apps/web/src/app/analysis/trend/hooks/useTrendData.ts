import { useDraws } from './useDraws';
import { useTrendFetch } from './useTrendFetch';

export const useTrendData = () => {
  const draws = useDraws();
  const search = useTrendFetch(draws.selectedDraw);
  return { ...draws, ...search };
};

export type TrendData = ReturnType<typeof useTrendData>;
