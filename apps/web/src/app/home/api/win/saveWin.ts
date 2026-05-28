/**
 * 홈 화면에서 **입력한 당첨번호를 서버에 저장**하는 도구입니다.
 *
 * 하는 일
 * - 선택한 회차와 6개 번호·보너스 번호를 서버에 보냅니다.
 * - 서버가 정상 처리하면 true, 거절·오류면 false를 넘깁니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: `SaveWinBody`(회차·num1~num6·bonus_num). `logic/saveBody`가 화면 입력에서 만듭니다.
 * - 돌려줌: 저장 성공 여부(true/false). 답 본문은 읽지 않습니다.
 *
 * 역할 나눔
 * - 경로 문자열: `constants/apiPath`의 `HOME_SAVE_WIN_PATH`
 * - 전체 주소 붙이기: `api/core/url.ts`의 `homeApiUrl`
 * - 요청 보내기: `api/core/fetchCore.ts`의 `postOk`
 * - 본문 조립: `logic/saveBody.ts`의 `buildSaveWinningBody`
 * - 저장 버튼·성공/실패 표시: `hooks/useSaveWinning.ts`
 *
 * 주의·화면에 미치는 영향
 * - false이면 저장 버튼 옆에 실패 상태가 잠시 보입니다. 네트워크 오류도 같은 방식입니다.
 * - 저장 전에 번호가 모두 유효한지는 UI(`GridControls`)에서 먼저 확인합니다.
 *
 * 이 파일을 쓰는 곳
 * - `hooks/useSaveWinning.ts`
 */

import { HOME_SAVE_WIN_PATH } from '../../constants/apiPath';
import type { SaveWinBody } from '../../types/win';
import { postOk } from '../core/fetchCore';
import { homeApiUrl } from '../core/url';

export const saveWin = (body: SaveWinBody): Promise<boolean> =>
  postOk(homeApiUrl(HOME_SAVE_WIN_PATH), body);
