---
description: 01-plan (개발 전 기획 및 마일스톤 작성)
---

# 01. 플랜 (개발 전 기획 및 태스크 브레이크다운)

이 단계는 실제 구현을 시작하기 전에 프로젝트의 목표를 정의하고, 기능 명세서(PRD)를 작성하며, 2~8시간 단위의 구체적인 태스크로 브레이크다운하는 `RFC(Request for Comments)` 성격의 핵심 단계입니다.

## 🎯 사용 스킬 지침
이 단계에서는 반드시 아래의 스킬들을 적극 활용하여 마스터플랜을 작성해야 합니다:

1. **`project-planner`** (핵심 스킬):
   - 전체 프로젝트를 수행 가능한 크기의 Task(2~8시간 분량)로 쪼갭니다.
   - 마일스톤(Milestone)을 정의하고, 작업 간의 의존성(Dependencies)을 매핑합니다.
   - 예상 소요 시간과 잠재적 리스크(Risk & Mitigation)를 분석합니다.

2. **`vercel-react-best-practices`** (보조 스킬):
   - 성능 최적화와 올바른 렌더링 패턴을 기획 단계부터 고려하여 목표(Requirements)에 반영합니다.

## 🛠️ 기술 스택 및 아키텍처 (Constraints)
모든 기획은 `.agents/rules/rules.md`에 명시된 원칙을 준수해야 합니다.
- **아키텍처**: 클린 아키텍처 (Domain, Application, Infrastructure, Interface/Presentation 계층 분리)
- **프론트엔드 스택**: Next.js 16.1.6 (App Router), React 19.2.3, Tailwind CSS v4, shadcn/ui 3.8.5, swr 2.4.0
- **백엔드 스택**: 파이썬 FastAPI, Uvicorn, pydantic, pandas, openpyxl
- **UI/UX 설계**: Tailwind CSS 기반 반응형 UI 설계 (`tailwind-component-architect` 활용)
- **API 설계**: oRPC Contract-First 패턴 적용하여 프론트-백엔드 간 타입 안정성 보장 (`orpc-contract-first` 활용)
- **데이터베이스**: 성능을 고려한 효율적인 쿼리 모델링
- **테스트 전략**: 기획 단계부터 기능 테스트(Vitest/RTL)를 고려한 설계 반영 (`frontend-testing` 활용)

## 📝 워크플로우 진행 순서

1. **사용자 인터뷰 및 목표 정의 (Define Success)**
   - 무엇을 만들고자 하는지 사용자의 의도를 파악합니다.
   - 성공 기준(Definition of Done)과 제약 사항(Constraints)을 명확히 합니다.

2. **마일스톤 및 결과물 도출 (Identify Deliverables)**
   - 프로젝트의 굵직한 산출물과 각 단계를 구분하는 마일스톤을 설정합니다.

3. **작업 세분화 (Break Down Tasks)**
   - `project-planner` 스킬의 가이드에 따라, 각 작업을 2시간~8시간 이내에 끝낼 수 있는 '실행 가능한 작은 태스크'로 분할합니다.

4. **의존성 맵 및 리스크 분석 (Map Dependencies & Risks)**
   - 병렬 처리가 가능한 작업과 선행되어야만 하는 작업을 구분하여 타임라인을 예측합니다.
   - 우려되는 기술적/일정상 리스크를 기록하고 완화 방안(Mitigation)을 세웁니다.

5. **최종 플랜 문서화 (Output Generation)**
   - 위에서 분석된 내용을 종합하여 하나의 깔끔한 마크다운 문서(`implementation-plan.md`)로 출력합니다.
   - 출력 포맷은 `project-planner` 스킬에 정의된 [Output Format] 표 형식을 엄격히 따릅니다.

---

**[에이전트 행동 강령]**
이 슬래시 커맨드를 실행하면, 즉시 사용자가 요청한 아이디어를 분석하여 위의 5단계를 거쳐 `project-planner` 표준 포맷의 **초안 기획서**를 출력하세요. 아직 실제 코드 파일(.tsx, .ts 등)을 수정하거나 생성해서는 안 됩니다.