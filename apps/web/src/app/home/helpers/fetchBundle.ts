/**
 * 홈 화면에서 선택한 회차의 핵심 데이터(추천 세트 + 당첨번호)를 한 번에 불러옵니다.
 *
 * 하는 일
 * - 추천 세트와 당첨번호를 동시에 요청해 화면 대기 시간을 줄입니다.
 * - 추천 세트 응답이 비정상(null/배열 아님)이면 안전하게 빈 세트 목록으로 정리합니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 회차 번호(drawNo)
 * - 돌려줌: `sets`(항상 배열), `winning`(없으면 null)
 *
 * 역할 나눔
 * - 추천 세트 조회: `api/recommend/drawings.ts`
 * - 당첨번호 조회: `api/win/winByDraw.ts`
 * - 추천 세트 형태 정리: `logic/toLotterySets.ts`
 */

import { loadDrawings } from '../api/recommend/drawings';
import { loadWinByNo } from '../api/win/winByDraw';
import { toLotterySets } from '../logic/toLotterySets';
import type { LotterySetData, WinningNumbersByDraw } from '../types/home';

export interface DrawBundle {
  sets: LotterySetData[];
  winning: WinningNumbersByDraw | null;
}

export const fetchDrawBundle = async (drawNo: number): Promise<DrawBundle> => {
  const [rawSets, winning] = await Promise.all([
    loadDrawings(drawNo),
    loadWinByNo(drawNo),
  ]);
  const sets = rawSets != null ? toLotterySets(rawSets) : [];

  return {
    sets,
    winning,
  };
};
