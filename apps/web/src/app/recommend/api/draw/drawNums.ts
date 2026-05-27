import { accuNumsApiUrl } from '@/app/recommend/api/core/url';
import { fetchJson } from '@/app/recommend/api/core/fetchCore';

/** 누적 분석 회차 번호 목록을 조회한다 */

export const fetchDrawNumbers = async (apiUrl: string): Promise<number[]> => {
  const data = await fetchJson<unknown>(accuNumsApiUrl('draw-numbers', apiUrl));
  if (!Array.isArray(data)) {
    throw new Error('Draw numbers response is not an array');
  }
  return data.filter((item): item is number => typeof item === 'number');
};
