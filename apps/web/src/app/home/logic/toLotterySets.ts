/**
 * 서버에서 받은 추천 세트 답을 화면에서 쓰는 세트 배열로 정리하는 도구입니다.
 *
 * 하는 일
 * - 값이 배열이면 세트 배열로 보고 그대로 넘깁니다.
 * - 배열이 아니면 안전하게 빈 목록을 돌려줍니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 형태를 모르는 서버 응답
 * - 돌려줌: `LotterySetData[]`
 *
 * 역할 나눔
 * - 실제 서버 호출은 `api/recommend/drawings.ts`가 담당합니다.
 * - 세트와 당첨번호를 함께 불러오는 묶음 로드는 `helpers/fetchBundle.ts`가 담당합니다.
 *
 * 주의·화면에 미치는 영향
 * - 배열이 아닌 응답은 빈 목록으로 처리되어, 카드가 없는 화면 상태로 보일 수 있습니다.
 */
import type { LotterySetData } from '../types/home';

export const toLotterySets = (data: unknown): LotterySetData[] =>
  Array.isArray(data) ? (data as LotterySetData[]) : [];
