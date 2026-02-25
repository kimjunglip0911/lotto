---
trigger: always_on
---

# Antigravity Agent Core Constitution v3.0

이 규칙은 모든 워크플로우(버그 수정, 코드 수정, 리팩토링, 신규 개발)에 **예외 없이 적용**되는 불변 원칙입니다.

## 1. 커뮤니케이션 원칙

### 전면 한글화 (Korean Only)
- Task, Implementation Plan, Progress Report 등 모든 생성 문서는 **반드시 한국어**로 작성하세요.
- 코드 내의 변수명, 함수명, 기술 용어는 프로젝트 표준(영어)을 따르되, **설명은 한글**로 제공하세요.
- 아티팩트 생성 시 마크다운 헤더를 적절히 사용하여 진행 상황을 한눈에 파악할 수 있게 하세요.

## 2. 오프라인 환경 (Internal Network Only)

> [!CAUTION]
> 사이트 사용자는 **외부 인터넷에 접근 불가능한 폐쇄망** 환경에서 접속합니다.

- **CDN 금지**: 외부 JS, CSS, Font 등 외부 리소스 호출을 엄격히 금지합니다.
- **로컬 자산만 사용**: 모든 라이브러리는 npm/pip으로 프로젝트 내부에 설치하여 번들링하세요.
- **이미지**: 프로젝트 내부에 포함시켜 관리하세요.

## 3. 데이터 통신 규정

### JSON First
- Frontend ↔ Backend 통신은 **JSON 형식**을 표준으로 합니다.
- **Frontend**: TypeScript Interface로 데이터 타입을 엄격히 관리하세요.
- **Backend**: FastAPI Pydantic 모델로 명확한 API 스키마를 정의하세요.

### 예외: MOCA 통신
- Backend → MOCA: **MOCA-XML** 형식 허용
- Frontend → Backend: 레거시 프록시(POST /service 등) 사용 시에 한해 MOCA-XML 허용
- 위 예외를 제외한 레거시 XML 포맷(`<list><row>...`) 사용은 **금지**합니다.

## 4. 코드 품질 가드레일

| 항목 | 규칙 |
|:---|:---|
| **Type Safety** | TypeScript Interface (Frontend) + Pydantic Model (Backend) 필수 |
| **Security** | 파라미터화된 쿼리 또는 ORM 사용. SQL Injection 방지. 하드코딩된 시크릿 금지 |
| **Vanilla JS 금지** | `document.getElementById` 등 직접 DOM 조작 대신 React 상태 기반 렌더링 사용 |
| **함수형 컴포넌트** | Class Component 금지. Functional Component + Hooks만 사용 |
| **컴포넌트 계층** | `components.md` 레지스트리를 반드시 확인 후 공통 컴포넌트 우선 사용 (ui → common → page-specific) |

## 5. UI/UX 표준

- **Tailwind Utility First**: 별도의 CSS 파일 생성 대신 Tailwind 유틸리티 클래스를 우선 사용하세요.
- **일관성**: 간격(Spacing), 그림자(Soft Shadows), 타이포그래피 계층을 통일하세요.
- **Responsive**: 반응형 디자인을 우선 고려하세요.
- **Chart Standard**: 차트 구현 시 **ApexCharts (`react-apexcharts`)**를 표준으로 사용합니다. Next.js App Router 환경의 SSR 에러(`window is not defined`) 방지를 위해 반드시 `next/dynamic`을 사용하여 `ssr: false` 옵션으로 동적 임포트하세요.

## 6. 문서 동기화

- 코드 변경 시 해당 기능 폴더의 `README.md`를 반드시 최신화하세요.