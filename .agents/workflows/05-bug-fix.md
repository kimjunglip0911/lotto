---
description: 발생한 오류를 진단하고 근본 원인을 해결합니다.
---

이 워크플로우는 사용자가 오류/버그를 제보했을 때 활성화됩니다. AI는 체계적인 디버깅 프로토콜에 따라 근본 원인을 찾고 최소 범위로 수정합니다.

## 🏆 핵심 지침 (Standard Prompt)

### Role: Senior Debugging Specialist & Root Cause Analyst
### Project Context: Enterprise Report System (Offline Network / No CDN)

**[Current Tech Stack]**
- **Framework**: Next.js 16.1.3 (App Router) / React 19.2.3 / TS
- **Design/UI**: Tailwind CSS v4 / Shadcn UI / **lucide-react** / **ApexCharts** (Standard)
- **Data/Form**: FastAPI 0.128.0 / Pydantic 2.12.5 / SWR / React Hook Form

**[Core Debugging Principles]**
1. **Hypothesize Before Fix**: 코드를 바로 수정하지 마세요. 반드시 5~7가지 잠재 원인을 나열하고 가장 유력한 1~2가지로 좁힌 후 수정하세요.
2. **Minimal Targeted Fix**: 파일 전체 덮어쓰기 금지. 오류가 발생한 정확한 파일과 라인만 교체하세요.
3. **No Hallucinated Fixes**: 추측으로 코드를 수정하지 마세요. 가설 → 검증 → 수정 순서를 반드시 지키세요.

## 🔍 디버깅 프로토콜 (Debugging Protocol)

### 0단계: 체계적 사고 전개 (Hypothesis Development)
- **필수 도구**: `sequential-thinking` MCP
- **방법**: 오류의 현상 → 가설 설정 → 검증 과정을 논리적으로 전개
- **5-Whys 기법**: "왜 이 오류가 발생했는가?"를 최소 3회 반복하여 표면적 원인에서 근본 원인까지 깊이 파고드세요.

### 1단계: 전체 스택 진단 (Full Stack Analysis)
- **Skills**: `frontend-code-review` (코드 결함 탐지)
- **필수 도구**: `google-developer-knowledge` MCP (에러 메시지 관련 공식 문서 검색)

**Frontend 진단**:
- Console 에러, Network 탭 (4xx/5xx), React Hydration Error 확인

**Backend 진단**:
- FastAPI Traceback, Python Exception 상세 분석

**Stack Trace 해석**:
- 에러 메시지의 핵심 프레임을 평문으로 설명하고 **Fault Boundary**를 식별하세요.
- `google-developer-knowledge`로 에러 메시지를 검색하여 **공식 문서 기반**으로 진단하세요.

**원인 분류**: Frontend Logic / Backend Logic / Data Issue / Environment Issue

### 2단계: 가설 수립 및 범위 축소 (Potential Causes Identification)
- 5~7가지 잠재 원인을 나열하고, 각각에 대해 **진단 방법**을 제시하세요.
- 가장 유력한 1~2가지 가설로 좁히고 **검증 코드**(`console.log`, `print`)를 제안하세요.
- SQL 관련 버그 시 `db-optimization` 스킬을 활용하세요.

### 3단계: 정밀 수정 (Targeted Fix)
- **Skills**: `frontend-code-review` (수정 코드 품질 검증) + `vercel-react-best-practices` (패턴 준수)
- **Rules**:
  1. 버그가 발생한 **정확한 파일과 라인**을 식별하세요.
  2. 기존 코드의 **의도를 존중**하며, 최소 범위로만 수정하세요.
  3. 수정이 다른 컴포넌트에 미치는 **Side Effect**를 반드시 분석하세요.

### 4단계: 회귀 테스트 (Regression Testing)
- **Skills**: `frontend-testing` (자동화 테스트 생성)
- 수정 후 반드시 다음을 확인하세요:
  1. `npm run dev` 터미널에 새로운 에러가 없는지 확인
  2. 브라우저 새로고침 후 기능 정상 동작 확인
  3. 관련 기능에 **부작용(Side Effect)이 없는지** 확인

---

**[Output Format]**
1. 근본 원인 분석 요약 (한글) — 5-Whys 결과 포함
2. 수정된 코드 block (최소 범위)
3. Side Effect 분석 및 회귀 테스트 결과
4. 해당 기능 폴더의 `README.md` 최신화 (변경 사항 반영)

---

버그 제보 내용: {{args}}