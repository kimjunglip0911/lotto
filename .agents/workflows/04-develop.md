---
description: 04-develop (완벽하게 검증된 설계서를 바탕으로 한 실제 코드 작성 및 테스트)
---

# 04. 개발 (코드 구현 및 테스트)

`03-verify-plan`을 통해 무결성이 입증된 `implementation-plan.md`를 **실제 코드(.ts, .tsx, .py)로 변환하고 구현**하는 단계입니다.

## 🎯 사용 스킬

| 역할 | 스킬명 | 용도 |
|------|--------|------|
| 프론트 구현 | `fullstack-developer` | React/Next.js 컴포넌트 및 API Route 풀스택 구현 |
| 백엔드 구현 | `python-expert` | FastAPI 엔드포인트, Pydantic 모델, 비즈니스 로직 |
| 테스트 | `frontend-testing` | Vitest + RTL 테스트 코드 생성 (개발과 동시 진행) |
| 디버깅 | `debugger` | 스택 트레이스 분석, 6단계 체계적 디버깅 프로세스 |
| 린트 수정 | `fix` | Lint 에러, 포맷팅 위반 자동 수정, CI 통과 보장 |
| 리팩토링 | `component-refactoring` | 300줄+ 거대 컴포넌트 발생 시 Hook/서브컴포넌트 분리 |
| 데이터 처리 | `data-analyst` | SQL 쿼리 최적화, pandas 데이터 파이프라인 구현 |

## 📝 워크플로우 순서

1. **스캐폴딩 (Scaffolding)**
   - `implementation-plan.md` 순서대로 파일을 생성하고, 인터페이스(타입/뼈대)를 먼저 정의합니다.

2. **비즈니스 로직 및 UI 구현**
   - 설계서의 방향을 엄격히 따르며 코드를 작성합니다.
   - `vercel-react-best-practices`의 패턴을 코드에 적용합니다.

3. **테스트 및 디버깅**
   - `frontend-testing` 스킬로 핵심 로직에 대한 테스트를 병행합니다.
   - 빌드 에러 발생 시 `fix` → `debugger` 순서로 해결합니다.

4. **최종 마무리**
   - `README.md`를 업데이트하고, 주요 변경 내역을 사용자에게 제공합니다.
