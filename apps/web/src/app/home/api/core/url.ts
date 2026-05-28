/**
 * 홈 화면에서 서버에 데이터를 물어볼 때 쓰는 **완성된 주소**와
 * **항상 새로 받기** 설정을 만드는 도구입니다.
 *
 * 하는 일
 * - API 경로 문자열 앞에 서버 주소(베이스)를 붙여 전체 URL을 만듭니다.
 * - 조회할 때 예전에 받아 둔 답을 쓰지 않도록 하는 옵션(`noStoreInit`)을 제공합니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - `homeApiUrl`: 경로(예: `/api/drawings/...`)와 선택적 베이스 주소 → 붙인 전체 주소 문자열
 * - `noStoreInit`: 조회 함수에 함께 넘기면, 브라우저가 예전 답을 재사용하지 않음
 *
 * 역할 나눔
 * - 실제 요청 보내기·답 내용 읽기는 같은 폴더 `fetchCore.ts`가 담당합니다.
 * - 당첨번호 **저장(보내기)** 는 `api/win/saveWin.ts`가 주소만 여기서 받아 `fetchCore.postOk`로 보냅니다.
 *
 * 주의·화면에 미치는 영향
 * - 베이스 주소가 비어 있으면(환경 변수 미설정) **같은 사이트**의 `/api/...` 로 호출합니다.
 * - 주소가 잘못 만들어지면 홈의 회차 목록·세트·당첨 표시가 비거나 갱신되지 않을 수 있습니다.
 *
 * 이 파일을 쓰는 곳
 * - `api/draw/drawNums`, `api/win/winByDraw`, `api/recommend/drawings`, `api/win/saveWin`(경로: `constants/apiPath`)
 */

const getApiBase = (baseUrl?: string): string =>
  (baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

const leadSlash = (path: string): string =>
  path.startsWith('/') ? path : `/${path}`;

export const homeApiUrl = (pathWithQuery: string, baseUrl?: string): string =>
  `${getApiBase(baseUrl)}${leadSlash(pathWithQuery)}`;

/** 조회 시 예전 답(캐시)을 쓰지 않고 항상 서버에서 새로 받는다 */
export const noStoreInit = { cache: 'no-store' as RequestCache };
