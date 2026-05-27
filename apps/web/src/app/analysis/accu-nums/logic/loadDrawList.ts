import { fetchDrawNumbers } from '../api';

export type DrawListLoadResult = {
  draws: number[];
  error: string | null;
};

/** 회차 목록 API를 호출해 조회 가능 회차 배열을 반환한다. */
export const loadAccDrawNumbers = async (signal: AbortSignal): Promise<DrawListLoadResult> => {
  try {
    const draws = await fetchDrawNumbers({ signal });
    return { draws, error: null };
  } catch (error) {
    if (signal.aborted) {
      return { draws: [], error: null };
    }
    console.error('Error fetching draw numbers:', error);
    return { draws: [], error: '회차 정보를 불러오지 못했습니다.' };
  }
};
