---
description: 03-verify-plan (상세 기술 설계안에 대한 치명적 오류 및 아키텍처 위반 사전 검증)
---

# 03. 검증 (설계 사전 리뷰)

`02-detail-plan`에서 완성된 기술 설계서를 바탕으로, **아키텍처 위반, 보안 취약점, 예외 처리 누락**을 코딩 전에 엄격하게 리뷰하는 단계입니다.

## 🎯 사용 스킬

| 역할 | 스킬명 | 용도 |
|------|--------|------|
| 프론트 리뷰 | `frontend-code-review` | 컴포넌트 구조, 성능, 비즈니스 로직 체크리스트 적용 |
| 전체 리뷰 | `code-reviewer` | Security → Performance → Correctness → Maintainability 4단계 |
| 성능 검증 | `vercel-react-best-practices` | Waterfall, 번들 크기, Re-render 패턴 위반 여부 검사 |
| 의사결정 | `decision-helper` | 설계 대안이 2개 이상일 때 Decision Matrix로 최적안 선택 |

## 📝 워크플로우 순서

1. **설계서 심층 리뷰**
   - `implementation-plan.md`의 데이터 흐름, 예외 처리(Error Handling), 로딩 상태(Loading State) 처리가 모두 명세되어 있는지 검증합니다.

2. **클린 아키텍처 규칙 검사**
   - `.agents/rules/rules.md`의 규칙(Domain ↔ Infrastructure 분리 등)이 설계에서 준수되고 있는지 대조합니다.

3. **성능 패턴 검증**
   - `vercel-react-best-practices`의 핵심 규칙(Waterfall 제거, 번들 크기, RSC 경계)을 기준으로 설계가 최적인지 점검합니다.

4. **취약점 및 엣지 케이스 분석**
   - 빈 배열, 서버 타임아웃, 잘못된 타입 전달 등 엣지 케이스를 찾고 해결책을 설계에 추가합니다.

5. **설계서 최종 승인**
   - 보완점들을 `implementation-plan.md`에 반영하고, 문서 상태를 **'Ready for Development'**로 명시합니다.
