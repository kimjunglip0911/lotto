# recommend api module

## 목적
- 추천 세트 생성/저장 관련 API 호출 함수를 제공한다.
- `generateSave.ts`는 생성 결과 저장 요청과 응답 검증을 담당한다.

## 실행(호출) 방법
- 상위 로직에서 `generateAndSaveSets(apiUrl, payload)`를 호출한다.
- 함수는 요청 본문 키를 서버 형식(`draw_no`, `applied_rule_ids`, `excluded_numbers`)으로 변환해 전송한다.

## 환경 변수
- 이 모듈은 환경 변수를 직접 읽지 않는다.
- 호출부에서 전달한 `apiUrl`과 `core/url.ts` 조합 규칙을 사용한다.

## 주의사항
- 서버 응답 상태가 실패이면 `Failed to generate and save sets: {status}` 오류를 던진다.
- 응답이 `GeneratedSet[]` 형식이 아니면 `Generate and save response is invalid` 오류를 던진다.
- 요청 본문 키 이름이 바뀌면 서버 저장 동작이 달라질 수 있으므로 기존 매핑 규칙을 유지해야 한다.
