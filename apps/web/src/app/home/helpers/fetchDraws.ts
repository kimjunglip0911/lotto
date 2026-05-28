/**
 * 홈 화면에서 회차 목록을 처음 불러올 때 사용하는 헬퍼입니다.
 *
 * 하는 일
 * - 서버에서 회차 번호 목록을 가져옵니다.
 * - 응답이 비어 있거나 없으면 화면이 안전하게 동작하도록 빈 배열을 돌려줍니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 없음
 * - 돌려줌: 회차 번호 배열(없으면 빈 배열)
 *
 * 역할 나눔
 * - 원본 회차 번호 조회: `api/draw/drawNums.ts`
 * - 화면용 회차 목록 형태 변환: `logic/buildDrawList.ts`
 */

import { loadDrawNumbers } from '../api/draw/drawNums';
import { buildDrawList } from '../logic/buildDrawList';

export const fetchDraws = async (): Promise<number[]> => {
  const drawNumbers = await loadDrawNumbers();
  if (drawNumbers == null) return [];
  return buildDrawList(drawNumbers);
};
