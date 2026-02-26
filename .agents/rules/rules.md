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

## 3. 웹 개발 필수 스킬 활용 가이드

프로젝트 개발 시 다음 스킬들을 상황에 맞춰 적극적으로 활용하세요:

- **UI/UX**: `tailwind-component-architect`를 사용하여 일관성 있고 반응형인 UI를 구축합니다.
- **성능**: `vercel-react-best-practices`를 준수하여 React/Next.js 성능을 최적화합니다.
- **API**: `orpc-contract-first` 패턴을 사용하여 타입 안정성이 보장되는 API 계약을 우선 설계합니다.
- **테스트**: `frontend-testing`을 활용하여 주요 로직에 대한 Vitest/RTL 테스트를 작성합니다.
- **DB**: `db-optimization` 가이드를 따라 효율적인 SQL을 작성합니다 (SELECT * 지양 등).

## 4. 문서 동기화

- 코드 변경 시 해당 기능 폴더의 `README.md`를 반드시 최신화하여 변경 사항과 구조를 설명하세요.