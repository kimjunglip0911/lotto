# recommend api core

## 목적
- 추천 기능에서 공통으로 쓰는 URL 조합, 조회, 오류 문구 변환 기반 함수를 제공한다.
- `url.ts`는 주소 조합, `fetchCore.ts`는 조회 공통 처리, `errorText.ts`는 오류 문구 변환만 담당한다.

## 실행(호출) 방법
- 서버 주소와 경로를 조합할 때 `resolveApiBaseUrl`, `recommendApiUrl`, `chiSquareApiUrl`, `accuNumsApiUrl`를 호출한다.
- 데이터 조회가 필요할 때 `fetchJson(url, init?)`를 호출한다.
- 예외를 화면 문구로 바꿀 때 `errorMessage(err)`를 호출한다.

## 환경 변수
- `url.ts`는 `resolveApiBaseUrl()` 호출 시 `NEXT_PUBLIC_API_URL` 값을 기본 서버 주소로 사용한다.
- 필요하면 각 URL 함수에 `baseUrl` 값을 직접 넘겨 환경 변수보다 우선 적용할 수 있다.

## 주의사항
- `url.ts`는 경로 앞 슬래시(`/`) 유무를 자동으로 맞춰 주지만, 경로 문자열 중간 오탈자까지 보정하지는 않는다.
- `resolveApiBaseUrl`은 끝 슬래시 1개만 제거하므로 서버 주소 입력 형식은 호출부에서 일관되게 관리해야 한다.
- 서버 응답 상태가 실패이면 `fetchJson`은 `Failed request: {status} {url}` 형식으로 오류를 던진다.
- `fetchJson`은 응답 본문을 JSON으로 읽으므로, JSON이 아닌 응답이면 상위에서 예외 처리해야 한다.
- `errorMessage`는 어떤 값이 들어와도 문자열을 돌려주므로 화면 오류 표시 단계를 유지할 수 있다.
