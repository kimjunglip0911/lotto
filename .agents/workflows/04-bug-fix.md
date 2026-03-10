---
description: 04-bug-fix (발생한 오류 진단 및 근본 원인 해결)
---

# 04. 버그 수정 (Bug Fix)

사용자가 오류/버그를 제보했을 때 활성화됩니다. 체계적인 디버깅 프로토콜에 따라 근본 원인을 찾고 최소 범위로 수정합니다.

## 🎯 사용 스킬

| 역할 | 스킬명 | 용도 |
|------|--------|------|
| 체계적 사고 | `sequential-thinking` (MCP) | 가설 설정 → 검증 → 수정의 전략적 전개 |
| 정보 탐색 | `google-developer-knowledge` (MCP) | 오류 메시지의 레퍼런스 공식 문서 확인 |
| 디버깅 | `debugger` | 체계적 디버깅 수행 (가설수립 및 검증) |
| 코드 진단 | `frontend-code-review` | 코드 결함 탐지, 체크리스트 기반 리뷰 |
| 품질 검증 | `code-reviewer` | 사이드 이펙트 가능성 확인 및 안정성 보장 |
| 패턴 확인 | `vercel-react-best-practices` | Next.js Hydration / Re-rendering 오류 탐색 |
| 회귀 테스트 | `frontend-testing` | 수정 후 관련 동작 깨짐 방지 테스트 |
| 린트 자동수정| `fix` | 수정 중 발생한 Lint, 괄호/포맷팅 오류 즉각 교정 |

## 🛠️ 기술 스택 (참조)

- **Framework**: Next.js 16.1.6 (App Router) / React 19.2.3 / TypeScript
- **Design/UI**: Tailwind CSS v4 / shadcn/ui / lucide-react / ApexCharts
- **Data/Form**: FastAPI / pydantic / SWR / React Hook Form

## 🔍 디버깅 프로토콜

### 핵심 원칙
1. **가설 먼저**: 코드를 바로 수정하지 말 것. 잠재 원인을 나열하고 1~2가지로 좁힌 후 수정.
2. **최소 수정**: 파일 전체 덮어쓰기 금지. 오류가 발생한 정확한 파일과 라인만 교체.
3. **추측 금지**: 가설 → 검증 → 수정 순서를 반드시 준수.

### 1단계: 오류 현상 진단
- **Frontend**: Console 에러, Network 탭 확인, React Hydration 발생 가능성 분석
- **Backend**: FastAPI Traceback, Python Exception 상세 로그 분석

### 2단계: 가설 수립 및 검증
- `sequential-thinking` 기반으로 발생한 오류에 대한 원인 가설을 수립하고, 검증 코드로 테스트하여 좁힙니다.

### 3단계: 정밀 개별 수정
- 버그 파일의 **정확한 라인**만을 의도를 존중하며 수정합니다.
- 부작용(Side Effect)이 타 컴포넌트에 발생하지 않는지 고려합니다.

### 4단계: 직접/회귀 테스트
- 브라우저나 엔드포인트를 다시 호출하여 에러가 재현되지 않는지 확인합니다.
