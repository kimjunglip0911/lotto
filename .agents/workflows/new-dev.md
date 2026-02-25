---
description: 사용자의 자연어 요청을 기반으로 신규 기능을 설계하고 구현합니다.
---

이 워크플로우는 사용자가 신규 페이지나 기능 개발을 요청했을 때 활성화됩니다. AI는 아키텍처 설계부터 구현, 검증까지 전 과정을 자동으로 수행합니다.

## 🏆 핵심 지침 (Standard Prompt)

### Role: System Designer & Full-Stack Page Architect
### Project Context: Enterprise Report System (Offline Network / No CDN)

**[Current Tech Stack]**
- **Framework**: Next.js 16.1.3 (App Router) / React 19.2.3 / TS
- **Design/UI**: Tailwind CSS v4 / Shadcn UI / **lucide-react** / **ApexCharts** (Standard)
- **Data/Form**: FastAPI 0.128.0 / Pydantic 2.12.5 / SWR / React Hook Form

## 🔨 신규 개발 프로토콜 (New Development Protocol)

### 0단계: 아키텍처 설계 (Sequential Thinking)
- **Objective**: 코드 작성 전에 전체적인 아키텍처와 흐름을 설계
- **필수 도구**: `sequential-thinking` MCP
- **Actions**:
  1. 요구사항의 모호함을 제거하고 명확한 구현 스펙으로 변환하세요.
  2. 데이터 모델, 컴포넌트 구조, API 계약을 선제적으로 정의하세요.

### 1단계: 요구사항 정제 및 구현 계획 (Requirements Refinement)
- **Objective**: 사용자의 자연어 요청을 기술 명세로 변환
- **참조 도구**: `google-developer-knowledge` MCP (공식 아키텍처 검색)
- **Skills**: `tailwind-component-architect` (UI 레이아웃 설계)
- **Actions**:
  1. **Page Structure**: Next.js App Router 기준 경로 정의 (예: `/dashboard/analytics`)
  2. **Data Requirements**: FastAPI 엔드포인트 + Pydantic 모델 설계
  3. **UI Specification**: Tailwind CSS + Shadcn UI 기반 레이아웃 정의
  4. `components.md`의 공통 컴포넌트(SearchButton, Pagination 등) 활용 여부 확인
  5. **Chart Standard**: 차트 구현 시 **ApexCharts (`react-apexcharts`)**를 사용 (`next/dynamic` ssr: false 필수)

### 2단계: 파일 계획 (File Planning)
- **Objective**: 생성할 핵심 파일 목록을 정의
- **Actions**:
  1. **Frontend Page**: `frontend/src/app/[feature_name]/page.tsx`
     - Server/Client Component (`"use client"`) 결정 명시
  2. **Backend Endpoint**: `server/main.py` 수정 또는 `server/routers/[feature_name].py` 생성
     - FastAPI 라우터 + Pydantic 모델 + DB 쿼리 로직
  3. **Documentation**: `frontend/src/app/[feature_name]/README.md`
     - 기능 명세 및 API 명세 포함

> [!NOTE]
> 별도의 CSS 파일(.css)은 생성하지 않습니다. Tailwind CSS 유틸리티 클래스만 사용합니다.

### 3단계: 코드 생성 (Code Generation)
- **Objective**: Backend → Frontend 순서로 구현
- **Skills**: `vercel-react-best-practices` (성능 최적화) + `tailwind-component-architect` (UI 구현)
- **Actions**:
  1. **Backend First**: API 엔드포인트를 먼저 구현하고 Swagger UI에서 테스트
  2. **Frontend Integration**: 구현된 API를 `fetch`/`SWR`로 호출하여 UI에 바인딩
  3. **Shared Components**: `components.md` 레지스트리의 공통 컴포넌트를 우선 사용
  4. **Type Safety**: TypeScript 인터페이스를 엄격히 정의
  5. SQL 쿼리 작성 시 `db-optimization` 스킬을 활용

### 4단계: 코드 검증 (Code Verification)
- **Objective**: 코드 품질, 보안, 성능 검증
- **Skills**: `frontend-code-review` (코드 품질 검증) + `vercel-react-best-practices` (패턴 준수)
- **Actions**:
  1. 보안 취약점 (SQL Injection, XSS 등) 점검
  2. 비효율적인 패턴이나 성능 병목 확인
  3. TypeScript 타입 안전성 검증

### 5단계: 브라우저 검증 (Browser Testing)
- **Objective**: 실제 페이지 접속을 통한 UI/데이터 연동 검증
- **Skills**: `frontend-testing` (자동화 테스트 생성)
- **Actions**:
  1. `npm run dev`로 개발 서버 실행 후 페이지 접속
  2. UI 렌더링 및 데이터 바인딩 정상 동작 확인
  3. 반응형 레이아웃 (14인치 노트북 / 27인치 모니터) 확인

---

**[Output Format]**
1. 생성된 전체 코드 block (파일별 분리)
2. 기능 명세 및 API 명세 요약 (한글)
3. 아키텍처 설계 다이어그램 (필요 시)

---

실행 요청: {{args}}