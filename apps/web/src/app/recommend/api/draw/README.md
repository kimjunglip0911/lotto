# recommend draw api

## 목적
- 추천 화면에서 사용할 회차 번호 목록 조회 함수를 제공한다.
- `drawNums.ts`는 회차 목록 조회와 숫자 배열 정제만 담당한다.

## 실행(호출) 방법
- 상위 훅/로직에서 `fetchDrawNumbers(apiUrl)`를 호출한다.
- 내부에서 `accuNumsApiUrl('draw-numbers', apiUrl)`로 조회 주소를 만들고 `fetchJson`으로 데이터를 읽는다.

## 환경 변수
- 이 모듈은 환경 변수를 직접 읽지 않는다.
- 호출부에서 전달한 `apiUrl`을 사용하며, URL 기본 규칙은 `core/url.ts`에서 처리한다.

## 주의사항
- 서버 응답이 배열이 아니면 `Draw numbers response is not an array` 오류를 던진다.
- 응답 배열 안에서 숫자가 아닌 값은 자동으로 제외하고 숫자만 반환한다.
- 회차 목록이 비어 있어도 함수는 오류 없이 빈 배열을 반환한다.
