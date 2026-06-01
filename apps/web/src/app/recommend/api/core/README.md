# recommend api core

## 목적
- 추천 기능에서 공통으로 쓰는 조회/오류 처리 기반 함수를 제공한다.
- `fetchCore.ts`는 조회 공통 처리, `errorText.ts`는 오류 문구 변환만 담당한다.

## 실행(호출) 방법
- 데이터 조회가 필요할 때 `fetchJson(url, init?)`를 호출한다.
- 예외를 화면 문구로 바꿀 때 `errorMessage(err)`를 호출한다.

## 환경 변수
- 이 모듈은 직접 환경 변수를 읽지 않는다.
- 실제 서버 주소는 상위 모듈에서 만든 URL을 입력으로 받는다.

## 주의사항
- 서버 응답 상태가 실패이면 `fetchJson`은 `Failed request: {status} {url}` 형식으로 오류를 던진다.
- `fetchJson`은 응답 본문을 JSON으로 읽으므로, JSON이 아닌 응답이면 상위에서 예외 처리해야 한다.
- `errorMessage`는 어떤 값이 들어와도 문자열을 돌려주므로 화면 오류 표시 단계를 유지할 수 있다.
