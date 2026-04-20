# Analysis Feature

신규 추천 번호 추출 로직을 연결하기 위한 분석 화면의 최소 골격을 제공합니다.

## 구성

- `page.tsx`: 분석 페이지 UI 엔트리
- `components/AnalysisController.tsx`: 생성/저장 트리거 UI
- `components/AnalysisResultList.tsx`: 신규 로직 연결 대기 안내 영역

## 동작 요약

- 기존 회차 조회/결과 조회/기존 생성 로직은 제거되었습니다.
- 생성 버튼 이벤트는 `page.tsx`의 `handleGenerateAndSave`를 통해 처리됩니다.
- `handleGenerateAndSave`는 신규 생성/저장 API 연결을 위한 확장 지점입니다.

## UI 스타일링 규칙

- 분석 UI 컴포넌트는 `frontend/src/page/analysis/components/*`에 위치하며 Tailwind 유틸리티를 직접 사용합니다.
- 페이지 간 테마 일관성을 위해 `bg-card`, `border-card-border`, `text-primary` 토큰을 우선 사용합니다.

