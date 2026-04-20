# Analysis Feature

분석 화면에서 JL 휠 기반 번호 생성/저장/중복 인사이트 결과를 조회합니다.

## 구성

- `page.tsx`: 분석 페이지 UI 엔트리
- `components/AnalysisController.tsx`: 생성/조회 컨트롤 UI
- `components/AnalysisResultList.tsx`: 세트 카드 리스트 렌더링

## 동작 요약

- 회차 목록은 `GET /api/drawings/draw-numbers`로 조회합니다.
- 저장된 세트는 `GET /api/drawings/by-no?draw_no=...`로 조회합니다.
- 통합 20세트 저장 생성은 `POST /api/analysis/generate-and-save`를 호출합니다.
- 휠 시뮬레이션 미저장 생성은 `GET /api/analysis/generate/wheel?count=20`를 호출합니다.

## UI 스타일링 규칙

- 분석 UI 컴포넌트는 `frontend/src/page/analysis/components/*`에 위치하며 Tailwind 유틸리티를 직접 사용합니다.
- 홈 공용 카드(`LotteryCard`)는 `frontend/src/page/home/components/LotteryCard.tsx`를 재사용합니다.
- 페이지 간 테마 일관성을 위해 `bg-card`, `border-card-border`, `text-primary` 토큰을 우선 사용합니다.

