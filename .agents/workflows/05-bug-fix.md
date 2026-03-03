---
description: 발생한 오류를 진단하고 근본 원인을 해결합니다.
---

# 05. 버그 수정 (Bug Fix)

사용자가 오류/버그를 제보했을 때 활성화됩니다. 체계적인 디버깅 프로토콜에 따라 근본 원인을 찾고 최소 범위로 수정합니다.

## 🎯 사용 스킬

| 역할 | 스킬명 | 용도 |
|------|--------|------|
| 체계적 사고 | `sequential-thinking` (MCP) | 가설 설정 → 검증 → 수정의 논리적 사고 전개 |
| 코드 진단 | `frontend-code-review` | 코드 결함 탐지, 체크리스트 기반 리뷰 |
| 공식 문서 | `google-developer-knowledge` (MCP) | 에러 메시지 관련 공식 문서 검색 |
| 디버깅 | `debugger` | 6단계 체계적 디버깅 (가설→검증→근본원인→수정) |
| 품질 검증 | `code-reviewer` | 수정 코드의 보안/성능/정확성 검증 |
| 패턴 준수 | `vercel-react-best-practices` | 수정 코드의 React/Next.js 패턴 준수 확인 |
| 회귀 테스트 | `frontend-testing` | 수정 후 자동화 테스트 생성 |
| 린트 수정 | `fix` | 수정 후 Lint/포맷팅 오류 자동 교정 |

## 🛠️ 기술 스택 (참조)

- **Framework**: Next.js 16.1.6 (App Router) / React 19.2.3 / TypeScript
- **Design/UI**: Tailwind CSS v4 / shadcn/ui / lucide-react / ApexCharts
- **Data/Form**: FastAPI / pydantic / SWR / React Hook Form

## 🔍 디버깅 프로토콜

### 핵심 원칙
1. **가설 먼저**: 코드를 바로 수정하지 말 것. 5~7가지 잠재 원인을 나열하고 1~2가지로 좁힌 후 수정.
2. **최소 수정**: 파일 전체 덮어쓰기 금지. 오류가 발생한 정확한 파일과 라인만 교체.
3. **추측 금지**: 가설 → 검증 → 수정 순서를 반드시 준수.

### 0단계: 체계적 사고 전개
- `sequential-thinking` MCP로 오류 현상 → 가설 설정 → 검증 과정을 논리적으로 전개합니다.
- **5-Whys 기법**: "왜 이 오류가 발생했는가?"를 최소 3회 반복합니다.

### 1단계: 전체 스택 진단
- **Frontend**: Console 에러, Network 탭 (4xx/5xx), React Hydration Error 확인
- **Backend**: FastAPI Traceback, Python Exception 상세 분석
- **Stack Trace**: 에러의 **Fault Boundary**를 식별하고, `google-developer-knowledge`로 공식 문서 기반 진단

### 2단계: 가설 수립 및 범위 축소
- 5~7가지 잠재 원인을 나열하고, 각각에 대해 진단 방법을 제시합니다.
- 가장 유력한 1~2가지 가설로 좁히고 검증 코드(`console.log`, `print`)를 제안합니다.

### 3단계: 정밀 수정
- 버그가 발생한 **정확한 파일과 라인**을 식별합니다.
- 기존 코드의 **의도를 존중**하며, 최소 범위로만 수정합니다.
- 수정이 다른 컴포넌트에 미치는 **Side Effect**를 반드시 분석합니다.

### 4단계: 회귀 테스트
1. `npm run dev` 터미널에 새로운 에러가 없는지 확인
2. 브라우저 새로고침 후 기능 정상 동작 확인
3. 관련 기능에 부작용(Side Effect)이 없는지 확인

---

**[Output Format]**
1. 근본 원인 분석 요약 (한글) — 5-Whys 결과 포함
2. 수정된 코드 block (최소 범위)
3. Side Effect 분석 및 회귀 테스트 결과
4. 해당 기능 폴더의 `README.md` 최신화

---

버그 제보 내용: {{args}}