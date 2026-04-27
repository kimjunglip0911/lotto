# Recommend Page

로또 추천 페이지(`frontend/src/app/recommend`)의 화면 흐름과 로직 구조를 설명합니다.

## 목적

- 추천 실행 시 제외 규칙을 순차 적용하고, 최종 추천 세트를 생성/저장합니다.
- 향후 규칙이 늘어나도 `logic/rules`에 파일을 추가하는 방식으로 확장할 수 있게 합니다.

## 화면 구성

- `page.tsx`: 화면 레이아웃과 컴포넌트 조합만 담당
- `hooks/useRecommendData.ts`: 회차 목록 로드 + 선택 회차 저장 세트/파이프라인 상태 조회
- `hooks/useRecommendGeneration.ts`: 생성/저장 실행 플로우 담당
- `components/AnalysisController.tsx`: 실행 버튼/회차 선택/당첨번호 표시
- `components/AnalysisResultList.tsx`: 적용 규칙, 제외 번호, 생성 결과 표시

## 로직 구조

- `logic/types.ts`
  - 규칙 공통 타입(`RecommendRule`, `RecommendRuleResult`, `RecommendRuleContext`)
  - API 응답 타입(`ExclusionCandidatesResponse`)
- `logic/api.ts`
  - Recommend/Analysis API 호출과 응답 파싱, 타입가드, 추세 계산 공통화
- `logic/pipeline.ts`
  - 규칙 배열을 순회하며 제외 번호를 누적 계산
- `logic/rules/excludeTopRankFromWindows.ts`
  - 누적 기준 제외 번호 규칙
- `logic/rules/excludeChiSquareHighDeviation.ts`
  - 카이제곱 편차 기반 제외 규칙
- `logic/rules/excludeTrendDown.ts`
  - 추세 하락 번호 제외 규칙(복원 번호 처리 포함)
- `logic/rules/excludeAbsenceStreakTop5.ts`
  - 장기 미출현 상위 번호 제외 규칙
- `logic/generator.ts`
  - 제외 후 사용 가능 번호 풀에서 최종 추천 세트 생성

## 확장 방법

1. `logic/rules`에 신규 규칙 파일 생성
2. `RecommendRule` 인터페이스로 `id`, `name`, `apply` 구현
3. `hooks/useRecommendData.ts`, `hooks/useRecommendGeneration.ts`의 규칙 배열에 신규 규칙을 추가

## 주의사항

- 백엔드 응답은 `unknown`으로 수신 후 타입 가드로 검증합니다.
- 추천 페이지는 `NEXT_PUBLIC_API_URL` 기반으로 백엔드와 통신합니다.
- 임시 디버그 호출/미사용 상태값/미사용 props는 유지하지 않습니다.
