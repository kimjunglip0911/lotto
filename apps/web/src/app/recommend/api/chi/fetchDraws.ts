import { chiSquareApiUrl } from '@/app/recommend/api/core/url';
import { fetchJson } from '@/app/recommend/api/core/fetchCore';

/**
 * 이 파일은 당첨 번호 이력 조회를 시작하기 전에, 먼저 회차 목록을 가져오는 일을 맡는다.
 * - 입력: 서버 주소를 받는다.
 * - 출력: 숫자 회차만 남긴 배열을 돌려준다.
 * - 역할 분리: 상세 범위 조회와 당첨 번호 행 검증은 다른 파일에서 담당한다.
 * - 실패 영향: 서버 응답이 배열이 아니면 즉시 오류를 던져 상위 흐름이 잘못된 데이터로 진행되지 않게 막는다.
 */

const isNumber = (item: unknown): item is number => typeof item === 'number';

export const fetchDraws = async (apiUrl: string): Promise<number[]> => {
  const payload = await fetchJson<unknown>(chiSquareApiUrl('draw-numbers', apiUrl));
  if (!Array.isArray(payload)) {
    throw new Error('Draw numbers response is not an array');
  }
  return payload.filter(isNumber);
};
