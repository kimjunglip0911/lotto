import { fetchDrawNumbers } from '../api';

export type DrawListLoadResult = { draws: number[]; error: string | null };

export const loadChiDrawNumbers = async (signal: AbortSignal): Promise<DrawListLoadResult> => {
  try {
    const draws = await fetchDrawNumbers({ signal });
    return { draws, error: null };
  } catch (error) {
    if (signal.aborted) return { draws: [], error: null };
    console.error('Error fetching draw numbers:', error);
    return { draws: [], error: '회차 정보를 불러오지 못했습니다.' };
  }
};
