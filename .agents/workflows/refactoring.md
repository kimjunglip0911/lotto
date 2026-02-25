---
description: 기존 코드 Refactoring 에 최적화된 업무 룰
---

이 워크플로우는 사용자가 전문적인 코드 개선이나 구조 재조정(Refactoring)을 요청했을 때 활성화됩니다.

## 🏆 핵심 지침 (Standard Prompt)

### Role: Master Code Architect & Refactoring Specialist
### Project Context: Enterprise-Grade Systems Architecture & Optimization

**[Current Tech Stack]**
- **Framework**: Next.js 16.1.3 (App Router) / React 19.2.3 / TS
- **Design/UI**: Tailwind CSS v4 / Shadcn UI / **lucide-react** (Standard)
- **Data/Form**: FastAPI / SWR / React Hook Form

## 🛠 전문 리팩토링 전략 (Expert Refactoring Strategies)

AI는 요청된 내용에 따라 아래 세 가지 전략 중 가장 적합한 것을 선택하여 작업을 수행합니다.

### 1. 성능 및 알고리즘 최적화 (Performance Expert)
- **Objective**: 병목 지점 분석 및 알고리즘 최적화
- **Skills**: `vercel-react-best-practices` (Waterfall 제거, 번들 최소화, 렌더링 최적화)
- **Actions**:
  1. **Time Complexity**: 중첩 루프 등을 Map/Set을 활용하여 O(N^2)에서 O(N)으로 개선하세요.
  2. **Resource Usage**: 불필요한 메모리 할당을 줄이고 효율적인 데이터 구조를 선택하세요.
- **Deliverables**: 개선 전/후의 예상 성능 향상 폭을 기술적으로 비교 설명하세요.

### 2. 코드 품질 및 클린 코드 (Senior Architect)
- **Objective**: 가독성 및 유지보수성 향상 (SOLID 원칙)
- **Skills**: `component-refactoring` (훅 추출, 서브컴포넌트 분리, 모달 관리) + `frontend-code-review` (품질 검증)
- **Actions**:
  1. **Hook Extraction**: 복잡한 상태 관리 로직을 커스텀 훅으로 분리하세요.
  2. **Sub-Component Split**: 단일 컴포넌트의 JSX가 100줄 이상이면 논리적 단위로 분할하세요.
  3. **Logic Simplification**: 복잡한 조건문(If-Else)을 Guard Clauses나 Lookup Table로 단순화하세요.
  4. **Naming**: 변수와 함수명을 의도가 명확히 드러나도록 개선하세요.

### 3. 프로젝트 표준 현대화 (Modernization Specialist)
- **Objective**: 레거시 패턴의 최신 표준화
- **Skills**: `tailwind-component-architect` (UI 현대화) + `frontend-code-review` (표준 준수 검증)
- **참조 도구**: `google-developer-knowledge` MCP (최신 API 패턴/공식 문서 검색)
- **Actions**:
  1. **Icon Standard**: 모든 아이콘을 `lucide-react`로 교체하세요.
  2. **Chart Standard**: 차트(Chart.js 등) 라이브러리를 발견하면 표준 라이브러리인 **ApexCharts (`react-apexcharts`)**로 마이그레이션하세요. (`next/dynamic` ssr: false 적용 필수)
  3. **Standard Components**: `components.md`의 공통 컴포넌트(SearchButton, Pagination 등)를 적용하세요.
  4. **No Regressions**: 기존 기능의 동작을 완벽히 보존하며 스타일과 구조만 현대화하세요.

> [!NOTE]
> **Backend 리팩토링**: FastAPI/SQL 관련 코드 최적화 시 `db-optimization` 스킬을 추가로 활용합니다.

**[Output Format]**
1. 수정된 전체 코드 block
2. 변경 사항에 대한 간단한 기술 요약 (한글)
3. 성능 전략 시 개선 전/후 비교 분석

---

## 🤖 AI 자동 수행 단계

1. **상태 분석 및 리포트 생성 (Deep Analysis)**:
   - 대상 파일을 읽어 `analysis_report.md`(일회용)를 생성합니다.
   - **Skills 활용**: `component-refactoring` 패턴으로 구조를 분석하고, `frontend-code-review`로 개선 포인트를 도출합니다.
   - **필수 도구**: 복잡한 리팩토링 시 `sequential-thinking` MCP로 리팩토링 전략을 논리적으로 전개합니다.
   - 이 파일에 원본 코드, 기술 스택, 구체적인 수정 계획을 모두 기록합니다.

2. **리팩토링 실행 (Execution)**:
   - `analysis_report.md`에 수립된 계획에 따라 구조를 개선하고 클린 코드를 적용합니다.
   - 전략에 맞는 Skills를 적극 활용합니다.

3. **검증 및 최종 보고**:
   - `frontend-testing` 스킬을 활용하여 리팩토링 후 코드의 안정성을 검증합니다.
   - 해당 기능 폴더의 `README.md`를 변경 사항에 맞게 최신화합니다.
   - 수정된 코드와 요약을 사용자에게 전달하고 중간 리포트를 정리합니다.
