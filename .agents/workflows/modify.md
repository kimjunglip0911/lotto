---
description: 사용자가 제공한 파일 경로와 요구사항을 바탕으로 기능을 자동으로 수정하고 분석합니다.
---

이 워크플로우는 사용자가 `작업시지서.md`에 '대상 경로'와 '수정 요구사항'만 입력했을 때 활성화됩니다. AI는 아래의 지침을 바탕으로 모든 과정을 자동으로 수행합니다.

## 🏆 핵심 지침 (Standard Prompt)

### Role: Senior Full-Stack Implementation Engineer
### Project Context: Enterprise Report System (Offline Network / No CDN)

**[Current Tech Stack]**
- **Framework**: Next.js 16.1.3 (App Router) / React 19.2.3 / TS
- **Design/UI**: Tailwind CSS v4 / Shadcn UI / **lucide-react** / **ApexCharts** (Standard)
- **Data/Form**: FastAPI / SWR / React Hook Form

## 🛠 작업 유형별 전략 (Task-Specific Strategies)

AI는 요청된 내용에 따라 아래 전략 중 가장 적합한 것을 선택하여 작업을 수행합니다.

### 1. 기능 수정 및 버그 수정 (Feature Modification / Bug Fix)
- **Goal**: 기존 코드의 동작을 변경하거나 결함을 수정
- **Skills**: `frontend-code-review` (수정 전후 품질 검증) + `vercel-react-best-practices` (성능 안전망)
- **Rules**:
  1. 수정 범위를 최소화하고 **기존 코드의 의도를 파악**한 뒤 구조를 존중하세요.
  2. 변경이 다른 컴포넌트에 미치는 **영향도(Side Effect)**를 반드시 분석하세요.
  3. 에러 핸들링과 엣지 케이스를 고려하세요.

### 2. 신규 기능 추가 (New Feature Development)
- **Goal**: 새로운 UI 컴포넌트나 API 엔드포인트를 구현
- **Skills**: `tailwind-component-architect` (UI 설계) + `vercel-react-best-practices` (성능 최적화)
- **참조 도구**: `google-developer-knowledge` MCP (공식 API/패턴 문서 검색)
- **Rules**:
  1. `components.md`의 공통 컴포넌트를 우선 활용하세요.
  2. 새 컴포넌트는 프로젝트의 디렉토리 구조 규칙을 따르세요.
  3. TypeScript 인터페이스를 명확히 정의하고 재사용 가능하게 설계하세요.
  4. 차트 구현 시 **ApexCharts (`react-apexcharts`)**를 표준으로 사용하세요. (`next/dynamic` ssr: false 적용 필수)

### 3. 백엔드 API 수정 (Backend API Modification)
- **Goal**: FastAPI 엔드포인트 또는 SQL 쿼리 수정
- **Skills**: `db-optimization` (SQL 최적화)
- **Rules**:
  1. Pydantic 모델로 엄격한 API 스키마를 정의하세요.
  2. SQL 쿼리는 `SELECT *` 금지, 좌변 가공 금지, 파라미터화된 쿼리를 사용하세요.
  3. 비동기(`async/await`) 패턴을 준수하세요.

**[Output Format]**
1. 수정된 전체 코드 block
2. 변경 사항에 대한 간단한 기술 요약 (한글)
3. 변경 영향도 분석 (Side Effect 유무)

---

## 🤖 AI 자동 수행 단계

1. **상태 분석 및 리포트 생성 (Deep Analysis)**:
   - 사용자가 `작업시지서.md`에 입력한 경로의 파일을 읽어 `analysis_report.md`(일회용)를 생성합니다.
   - **Skills 활용**: `frontend-code-review`로 현재 코드의 잠재적 문제를 사전 진단합니다.
   - **필수 도구**: 복잡한 수정 시 `sequential-thinking` MCP로 구현 전략을 논리적으로 전개합니다.
   - 이 파일에 원본 코드, 기술 스택, 구체적인 수정 계획을 모두 기록합니다.

2. **기능 수정/추가 (Execution)**:
   - `analysis_report.md`에 수립된 계획에 따라 실제 소스 코드를 수정합니다.
   - 작업 유형에 맞는 Skills를 적극 활용합니다.

3. **최종 보고 및 정리**:
   - 수정된 코드와 기술 요약을 사용자에게 전달합니다.
   - 해당 기능 폴더의 `README.md`를 변경 사항에 맞게 최신화합니다.
   - 작업 완료 후 불필요한 분석 리포트는 정리합니다.

---

> [!IMPORTANT]
> 사용자는 **경로**와 **수정 요구사항**만 작성하면 됩니다. AI가 위의 모든 전문적인 역할을 대신 수행합니다.
