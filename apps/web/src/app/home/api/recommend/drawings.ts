/**
 * 홈 화면 **선택 회차의 추천 분석 세트 목록**을 서버에서 받아 오는 도구입니다.
 *
 * 하는 일
 * - 추천 API에서 해당 회차에 저장된 분석 번호 세트(최대 30세트) 목록을 한 번 조회합니다.
 * - 받은 답을 그대로 넘기며, 화면에서 세트 카드로 바꾸는 일은 `helpers/drawList.ts`가 합니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 회차 번호, 요청을 중간에 끊을 때 쓰는 신호(signal, 선택)
 * - 돌려줌: 서버가 준 세트 목록(배열 형태), 또는 받기 실패·오류 시 null
 *
 * 역할 나눔
 * - 주소 만들기·“항상 새로 받기” 설정은 `api/core/url.ts`
 * - 요청 보내기·답 읽기는 `api/core/fetchCore.ts`
 * - 경로 문자열은 `constants/apiPath.ts`
 * - 세트·당첨을 함께 묶어 로드는 `helpers/fetchBundle.ts`
 *
 * 주의·화면에 미치는 영향
 * - 실패 시 null이 되고, 해당 회차 분석 세트 카드가 비어 보일 수 있습니다.
 *
 * 이 파일을 쓰는 곳
 * - `helpers/fetchBundle.ts`
 */

import { HOME_RECOMMEND_DRAWINGS_PATH } from '../../constants/apiPath';
import { getJsonOrNull } from '../core/fetchCore';
import { homeApiUrl, noStoreInit } from '../core/url';

const drawingsUrl = (drawNo: number): string =>
  homeApiUrl(`${HOME_RECOMMEND_DRAWINGS_PATH}?draw_no=${drawNo}`);

export const loadDrawings = async (
  drawNo: number,
  signal?: AbortSignal,
): Promise<unknown | null> =>
  getJsonOrNull(drawingsUrl(drawNo), { signal, ...noStoreInit });
