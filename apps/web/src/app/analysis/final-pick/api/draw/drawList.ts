import { normalizeDrawNumbers } from '../../helpers/normDraw';
import { drawNumbersApiUrl } from '../core/url';

export type DrawListFetchResult = { draws: number[]; error: string | null };

/** 조회 가능 회차 목록을 가져온다. */
export const fetchFinalPickDrawList = async (signal?: AbortSignal): Promise<DrawListFetchResult> => {
  try {
    const response = await fetch(drawNumbersApiUrl(), { signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to fetch draw numbers: ${response.status}`);
    const data: unknown = await response.json();
    const draws = normalizeDrawNumbers(data);
    if (draws.length === 0) throw new Error('Draw numbers response does not contain valid draws');
    return { draws, error: null };
  } catch (error) {
    if (signal?.aborted) return { draws: [], error: null };
    console.error('Error fetching draw numbers:', error);
    return { draws: [], error: '회차 정보를 불러오지 못했습니다.' };
  }
};
