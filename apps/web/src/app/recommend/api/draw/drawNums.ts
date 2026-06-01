import { accuNumsApiUrl } from '@/app/recommend/api/core/url';
import { fetchJson } from '@/app/recommend/api/core/fetchCore';

/**
 * 이 파일은 추천 기능에서 사용할 회차 번호 목록을 서버에서 가져와 숫자 값만 남기는 일을 담당한다.
 * - 입력: 서버 주소 문자열을 받는다.
 * - 출력: 회차 번호 숫자만 담긴 배열을 돌려준다.
 * - 역할 분리: 주소 조합은 URL 유틸에서, 실제 화면 상태 변경은 훅/로직 파일에서 담당한다.
 * - 실패 영향: 서버 응답이 배열이 아니면 즉시 오류를 던져 상위 흐름이 잘못된 데이터로 진행되지 않게 막는다.
 */

const isNumber = (item: unknown): item is number => typeof item === 'number';

export const fetchDrawNumbers = async (apiUrl: string): Promise<number[]> => {
  const data = await fetchJson<unknown>(accuNumsApiUrl('draw-numbers', apiUrl));
  if (!Array.isArray(data)) {
    throw new Error('Draw numbers response is not an array');
  }
  return data.filter(isNumber);
};
