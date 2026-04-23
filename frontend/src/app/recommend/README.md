# Recommend Page

로또 추천 페이지(`frontend/src/app/recommend`)의 화면 흐름과 로직 구조를 설명합니다.

## 목적

- 추천 실행 시 제외 규칙을 순차 적용하고, 최종 추천 세트를 생성/저장합니다.
- 향후 규칙이 늘어나도 `logic/rules`에 파일을 추가하는 방식으로 확장할 수 있게 합니다.

## 화면 구성

- `page.tsx`: 추천 실행 전체 오케스트레이션
  - 제외 후보 조회 (`GET /api/recommend/exclusion-candidates`)
  - 규칙 파이프라인 실행 (`logic/pipeline.ts`)
  - 추천 생성/저장 (`POST /api/recommend/generate-and-save`)
- `components/AnalysisController.tsx`: 실행 버튼/상태 표시
- `components/AnalysisResultList.tsx`: 적용 규칙, 제외 번호, 생성 결과 표시

## 로직 구조

- `logic/types.ts`
  - 규칙 공통 타입(`RecommendRule`, `RecommendRuleResult`, `RecommendRuleContext`)
  - API 응답 타입(`ExclusionCandidatesResponse`)
- `logic/pipeline.ts`
  - 규칙 배열을 순회하며 제외 번호를 누적 계산
- `logic/rules/excludeLeastFrequentOverall.ts`
  - 1번 규칙: 누적 최저 출현 번호 제외
- `logic/rules/excludeTopRankFromWindows.ts`
  - 2번 규칙: 전체/6개월/1년/3년/5년/10년 1등 번호를 집합으로 제외

## 확장 방법

1. `logic/rules`에 신규 규칙 파일 생성
2. `RecommendRule` 인터페이스로 `id`, `name`, `apply` 구현
3. `page.tsx`의 규칙 배열에 신규 규칙을 추가

## 주의사항

- 백엔드 응답은 `unknown`으로 수신 후 타입 가드로 검증합니다.
- 추천 페이지는 `NEXT_PUBLIC_API_URL` 기반으로 백엔드와 통신합니다.
- 임시 디버그 호출/미사용 상태값/미사용 props는 유지하지 않습니다.
