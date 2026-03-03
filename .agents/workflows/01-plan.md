---
description: 01-plan (개발 전 기획 및 마일스톤 작성)
---

# 01. 플랜 (초기 기획 및 태스크 브레이크다운)

이 단계는 실제 구현을 시작하기 전에 프로젝트의 목표를 정의하고, 2~8시간 단위의 구체적인 태스크로 브레이크다운하는 핵심 기획 단계입니다.

## 🎯 사용 스킬

| 역할 | 스킬명 | 용도 |
|------|--------|------|
| 핵심 | `project-planner` | 태스크 분할(2~8h), 마일스톤, 의존성 맵, 리스크 분석 |
| 보조 | `strategy-advisor` | 기술적 대안이 여러 개일 때 전략적 방향 설정 |

> ⚠️ 이 단계에서는 코드를 작성하지 않습니다. 오직 문서(`implementation-plan.md`)만 생성합니다.

## 🛠️ 기술 스택 제약 (Constraints)

모든 기획은 `.agents/rules/rules.md`를 준수해야 합니다.

- **아키텍처**: 클린 아키텍처 (Domain → Application → Infrastructure → Interface 계층 분리)
- **프론트엔드**: Next.js 16.1.6 (App Router), React 19.2.3, Tailwind CSS v4, shadcn/ui 3.8.5, swr 2.4.0
- **백엔드**: FastAPI, Uvicorn, pydantic, pandas, openpyxl

## 📝 워크플로우 순서

1. **목표 정의 (Define Success)**
   - 사용자의 의도를 파악하고, 성공 기준(Definition of Done)과 제약 사항을 명확히 합니다.

2. **마일스톤 설정 (Identify Deliverables)**
   - 프로젝트의 굵직한 산출물과 각 단계를 구분하는 마일스톤을 설정합니다.

3. **작업 세분화 (Break Down Tasks)**
   - `project-planner` 스킬의 가이드에 따라, 각 작업을 2~8시간 이내에 끝낼 수 있는 태스크로 분할합니다.

4. **의존성 맵 및 리스크 분석 (Map Dependencies & Risks)**
   - 병렬 처리 가능한 작업과 선행 작업을 구분하여 타임라인을 예측합니다.
   - 기술적/일정상 리스크를 기록하고 완화 방안(Mitigation)을 세웁니다.

5. **플랜 문서 출력 (Output)**
   - `project-planner` 스킬의 표준 포맷으로 `implementation-plan.md`를 생성합니다.

---

**[에이전트 행동 강령]**
이 슬래시 커맨드 실행 시, 사용자의 아이디어를 분석하여 위 5단계를 거쳐 **초안 기획서**를 출력하세요. 코드 파일(.tsx, .ts, .py)을 수정하거나 생성해서는 안 됩니다.