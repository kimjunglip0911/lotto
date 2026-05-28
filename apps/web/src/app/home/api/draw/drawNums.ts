/**
 * 홈 화면 **회차 선택 목록**을 서버에서 받아 오는 도구입니다.
 *
 * 하는 일
 * - 누적 분석 API에서 “검색 가능한 회차 번호” 목록을 한 번 조회합니다.
 * - 받은 답에서 정수 회차만 골라 배열로 넘깁니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 선택: 요청을 중간에 끊을 때 쓰는 신호(signal)
 * - 돌려줌: 정수 회차 배열, 또는 받기 실패·형식 오류 시 null
 *
 * 역할 나눔
 * - 주소 만들기·“항상 새로 받기” 설정은 `api/core/url.ts`
 * - 요청 보내기·답 읽기는 `api/core/fetchCore.ts`
 * - 숫자 배열로 거르기는 `logic/parseDrawArr.ts`
 * - 화면용 목록(첫 회차+1 등)은 `helpers/fetchDraws.ts`·`helpers/drawList.ts`
 *
 * 주의·화면에 미치는 영향
 * - 실패 시 null이 되고, 홈 회차 드롭다운이 비거나 기본 선택이 없을 수 있습니다.
 *
 * 이 파일을 쓰는 곳
 * - `helpers/fetchDraws.ts`
 */

import { HOME_DRAW_NUMBERS_PATH } from '../../constants/apiPath';
import { parseDrawNumArr } from '../../logic/parseDrawArr';
import { getJsonOrNull } from '../core/fetchCore';
import { homeApiUrl, noStoreInit } from '../core/url';

export const loadDrawNumbers = async (
  signal?: AbortSignal,
): Promise<number[] | null> => {
  const data = await getJsonOrNull<unknown>(
    homeApiUrl(HOME_DRAW_NUMBERS_PATH),
    { signal, ...noStoreInit },
  );
  if (data == null) return null;
  return parseDrawNumArr(data);
};
