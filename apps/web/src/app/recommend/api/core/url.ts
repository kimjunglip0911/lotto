/**
 * 이 파일은 추천 기능에서 쓰는 주소 문자열을 한 가지 규칙으로 조합한다.
 * - 입력: 서버 기본 주소와 세부 경로(필요 시 물음표 포함)를 받는다.
 * - 출력: 중복 슬래시를 피한 최종 요청 주소를 돌려준다.
 * - 역할 분리: 실제 서버 호출과 응답 처리, 오류 문구 변환은 다른 파일에서 담당한다.
 * - 실패 영향: 주소가 잘못 조합되면 조회가 실패하므로, 선행 슬래시 유무를 이 파일에서 통일해 호출부 실수를 줄인다.
 */

const trimTailSlash = (value: string): string => value.replace(/\/$/, '');
const ensureLeadSlash = (value: string): string => (value.startsWith('/') ? value : `/${value}`);

export const resolveApiBaseUrl = (baseUrl?: string): string =>
  trimTailSlash(baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? '');

export const recommendApiUrl = (pathWithQuery: string, baseUrl?: string): string =>
  `${resolveApiBaseUrl(baseUrl)}${ensureLeadSlash(pathWithQuery)}`;

export const accuNumsApiUrl = (pathWithQuery: string, baseUrl?: string): string =>
  recommendApiUrl(`/api/analysis/accu-nums/${pathWithQuery}`, baseUrl);
