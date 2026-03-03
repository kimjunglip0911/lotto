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

## 2. 클린 아키텍처 (Clean Architecture) 원칙

### 계층 분리 및 의존성 규칙
- **Domain**: 핵심 비즈니스 로직과 엔티티. 외부 의존성 없음.
- **Application**: 유스케이스, 서비스. 도메인에만 의존.
- **Infrastructure**: DB, API 클라이언트, 외부 라이브러리 연동.
- **Interface/Presentation**: UI 컴포넌트, 컨트롤러.
- **의존성 방향**: 의존성은 항상 고수준 정책(안쪽)으로 향해야 하며, 외부 프레임워크 변경이 비즈니스 로직에 영향을 주어서는 안 됩니다.

## 3. 기술 스택 (Tech Stack) 및 스킬 활용 가이드

기획 및 개발 시 현재 프로젝트에 설치된 아래의 기술 세팅 및 버전을 반드시 준수해야 합니다.

### 🏛️ 프론트엔드 (Frontend) - `frontend/`
- **Framework**: `Next.js 16.1.6` (App Router 권장)
- **Library**: `React 19` (19.2.3), `react-dom 19`
- **Styling**: `Tailwind CSS v4` (`@tailwindcss/postcss` 기반)
- **UI Components**: `shadcn/ui` (3.8.5), `radix-ui`, `lucide-react` (0.575.0)
- **State/Fetching**: `swr` (2.4.0), `react-hook-form`
- **Charts/Vis**: `apexcharts` (5.6.0)

### ⚙️ 백엔드 (Backend) - `backend/`
- **Framework**: `FastAPI` (w/ Uvicorn)
- **Data Processing**: `pandas`, `openpyxl`
- **Validation**: `pydantic`

## 4. 문서 동기화

- 코드 변경 시 해당 기능 폴더의 `README.md`를 반드시 최신화하여 변경 사항과 구조를 설명하세요.

## 5. 표준 개발 워크플로우 헌법 (The Workflow Law)

에이전트와 사용자는 프로젝트의 품질과 안정성을 위해 어떠한 작업을 하든 **반드시 다음 4단계의 워크플로우 순서**를 거쳐야 합니다. 단일 파일의 단순 수정이 아닌 이상, 이 파이프라인 우회는 금지됩니다.

### [Phase 1] `/01-plan` (초기 기획)
- **개념**: 사용자의 아이디어를 구체적인 태스크(2~8시간)와 마일스톤으로 쪼개는 단계.
- **산출물**: `implementation-plan.md` 생성 개시.
- **핵심 스킬**: `project-planner`

### [Phase 2] `/02-detail-plan` (기술 상세 설계)
- **개념**: Phase 1의 플랜을 바탕으로 구체적인 파일 디렉토리, DB 스키마, oRPC 계약, UI 컴포넌트 트리를 문서화.
- **산출물**: `implementation-plan.md` 내 [상세 기술 설계] 완료 및 확정.
- **핵심 스킬**: `tailwind-component-architect`, `orpc-contract-first`, `vercel-react-best-practices`

### [Phase 3] `/03-verify-plan` (사전 검증)
- **개념**: 코딩 전 설계서의 엣지 케이스, 에러 핸들링, 클린 아키텍처 규칙 위반 여부 엄격 검사.
- **산출물**: 무결성이 검증되어 'Ready for Development' 상태가 명시된 `implementation-plan.md`.
- **핵심 스킬**: `frontend-code-review`, `code-reviewer`, `decision-helper`

### [Phase 4] `/04-develop` (구현 및 수정)
- **개념**: 철저히 검증된 설계서(`implementation-plan.md`)의 내용만을 코드로 옮겨 적고 테스트하는 실제 개발 프로세스.
- **산출물**: 코딩 완료된 파일들, `README.md` 업데이트, 테스트 통과 증명.
- **핵심 스킬**: `frontend-testing`, `python-expert`, `fix`, `debugger`