---
description: 02-detail-plan (기획을 바탕으로 한 기술적 상세 설계 및 아키텍처 정의)
---

# 02. 디테일 플랜 (기술 상세 설계)

`01-plan`에서 도출된 `implementation-plan.md`를 바탕으로, **파일 구조, API 명세, DB 스키마, UI 컴포넌트 트리**를 구체적으로 설계하는 단계입니다.

## 🎯 사용 스킬

| 역할 | 스킬명 | 용도 |
|------|--------|------|
| UI 설계 | `tailwind-component-architect` | Tailwind 기반 컴포넌트 트리, Props/State 명세 |
| API 설계 | `orpc-contract-first` | Contract-First 기반 타입 안전한 API 규격 정의 |
| 백엔드 설계 | `python-expert` | Pydantic 모델, DB 스키마, FastAPI 라우터 설계 |
| 성능 설계 | `vercel-react-best-practices` | RSC/Client 구분, Waterfall 제거, 번들 최적화 고려 |
| UX 설계 | `ux-designer` | 유저 플로우, 와이어프레임 구조 설계 (필요 시) |

## 📝 워크플로우 순서

1. **초안 문서 분석**
   - `implementation-plan.md`의 목표와 마일스톤을 깊이 있게 읽고 기술적 맥락을 파악합니다.

2. **디렉토리 및 파일 구조 설계**
   - `frontend/src/` 및 `backend/` 하위의 정확한 파일 경로 리스트를 작성합니다.

3. **API & 데이터베이스 명세**
   - 프론트-백엔드 통신 규격(Request/Response Type)과 DB 테이블 스키마를 마크다운 표 형식으로 설계합니다.

4. **컴포넌트 설계 (Props & State)**
   - UI 컴포넌트 트리 구조를 그리고, 각 컴포넌트의 Props와 내부 상태(State) 로직을 구상합니다.
   - `vercel-react-best-practices`를 참조하여 서버/클라이언트 컴포넌트 경계를 명확히 합니다.

5. **디테일 플랜 문서화**
   - 설계된 모든 내용을 `implementation-plan.md`의 **[상세 기술 설계]** 챕터에 병합하여, 코딩을 바로 시작할 수 있는 수준의 문서를 완성합니다.
