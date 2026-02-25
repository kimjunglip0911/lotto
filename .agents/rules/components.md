---
trigger: always_on
---

# 공통 컴포넌트 레지스트리

새 UI를 만들기 전에 **반드시 이 목록을 확인**하고 공통 컴포넌트를 우선 사용하세요.

## 1계층: Primitive UI (`src/components/ui/`)

| 컴포넌트 | 경로 | 설명 |
|:---|:---|:---|
| **Button** | `ui/button.tsx` | Shadcn 기반 버튼 |
| **Input** | `ui/input.tsx` | 텍스트 입력 필드 |
| **Checkbox** | `ui/checkbox.tsx` | 체크박스 |
| **Loading** | `ui/Loading.tsx` | 스피너 + 로딩 텍스트 |

> Barrel Export: `import { Button, Input, Checkbox } from '@/components/ui'`

## 2계층: Shared Components (`src/components/common/`)

| 컴포넌트 | 경로 | 설명 |
|:---|:---|:---|
| **Pagination** | `common/Pagination.tsx` | 테이블 페이지 네비게이션 |
| **SearchButton** | `common/SearchButton.tsx` | 조회 버튼 (로딩 스피너 포함) |
| **LoginRequired** | `common/LoginRequired.tsx` | 비로그인 안내 메시지 |
| **AnimatedFlipButton** | `common/AnimatedFlipButton.tsx` | 3D 회전 및 클릭 애니메이션 버튼 |

## 계층 규칙

```
src/components/ui/         ← 1계층: Primitive
src/components/common/     ← 2계층: Shared
src/app/**/components/     ← 3계층: Page-specific
```

1. **상위 계층 우선**: 1~2계층에 동일 컴포넌트가 있으면 반드시 사용
2. **반복 시 승격**: 2곳 이상에서 동일 패턴 사용 시 `common/`으로 이동
3. **의존 방향**: `3계층 → 2계층 → 1계층` (역방향 금지)
