/**
 * 홈 화면 **선택 회차에 저장된 당첨번호**를 서버에서 받아 오는 도구입니다.
 *
 * 하는 일
 * - 해당 회차에 이미 저장된 6개 번호·보너스 번호를 한 번 조회합니다.
 * - 받은 답을 화면 입력란에 채우는 일은 `hooks/useWinInput`·`helpers/fetchBundle`이 합니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 회차 번호, 요청을 중간에 끊을 때 쓰는 신호(signal, 선택)
 * - 돌려줌: 당첨번호 객체(`WinningNumbersByDraw`), 또는 받기 실패·저장 없음 시 null
 *
 * 역할 나눔
 * - 경로 문자열: `constants/apiPath`의 `HOME_WINNING_BY_NO_PATH`
 * - 전체 주소 붙이기·“항상 새로 받기” 설정: `api/core/url.ts`
 * - 요청 보내기·답 읽기: `api/core/fetchCore.ts`의 `getJsonOrNull`
 * - 세트·당첨을 함께 묶어 로드: `helpers/fetchBundle.ts`
 * - 당첨번호 저장(보내기): `api/win/saveWin.ts`의 `saveWin`
 *
 * 주의·화면에 미치는 영향
 * - 실패·미저장 시 null이 되고, 당첨 입력란이 비어 보일 수 있습니다.
 *
 * 이 파일을 쓰는 곳
 * - `helpers/fetchBundle.ts`
 */

import { HOME_WINNING_BY_NO_PATH } from '../../constants/apiPath';
import type { WinningNumbersByDraw } from '../../types/home';
import { getJsonOrNull } from '../core/fetchCore';
import { homeApiUrl, noStoreInit } from '../core/url';

const winByNoUrl = (drawNo: number): string =>
  homeApiUrl(`${HOME_WINNING_BY_NO_PATH}?draw_no=${drawNo}`);

export const loadWinByNo = async (
  drawNo: number,
  signal?: AbortSignal,
): Promise<WinningNumbersByDraw | null> =>
  getJsonOrNull<WinningNumbersByDraw>(winByNoUrl(drawNo), {
    signal,
    ...noStoreInit,
  });
