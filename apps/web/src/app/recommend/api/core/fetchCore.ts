/**
 * 이 파일은 서버에서 값을 받아 오는 공통 조회 동작을 한곳에서 처리한다.
 * - 입력: 조회할 주소와 추가 요청 옵션을 받는다.
 * - 출력: 서버가 돌려준 본문 값을 지정한 형태로 돌려준다.
 * - 역할 분리: 오류 문구를 사용자 문장으로 바꾸는 일은 다른 파일에서 담당한다.
 * - 실패 영향: 서버가 실패를 알리면 즉시 오류를 던져 상위 화면 로직이 안내 문구나 대체 흐름을 선택하도록 한다.
 */

export const fetchJson = async <T = unknown>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Failed request: ${response.status} ${url}`);
  }
  return (await response.json()) as T;
};
