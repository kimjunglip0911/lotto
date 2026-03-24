# Features 폴더 기반 프로젝트 구조 가이드

이 문서는 **Next.js(프론트엔드) + FastAPI(백엔드)** 프로젝트에서  
페이지(기능)별로 프론트엔드와 백엔드를 한 폴더에 묶는 구조를 설명합니다.

어떤 프로젝트에든 동일하게 적용할 수 있습니다.

---

## 1. 왜 이 구조인가

| 기존 구조 | Features 구조 |
|:---|:---|
| 프론트는 `frontend/`, 백엔드는 `server/`에 분리 | 한 기능의 프론트+백이 같은 폴더에 |
| "home 수정" 시 3~4개 폴더를 찾아야 함 | `features/home/` 하나만 열면 됨 |
| `main.py`에 엔드포인트 40개 이상 몰림 | 도메인별 `router.py`로 분산 |

---

## 2. 전체 구조

```
프로젝트루트/
│
├── features/                        # 페이지별 프론트+백 묶음
│   ├── home/
│   │   ├── page.tsx                 # 프론트엔드 메인 페이지
│   │   ├── components/              # 이 페이지 전용 컴포넌트
│   │   │   ├── SummaryCard.tsx
│   │   │   └── DataTable.tsx
│   │   ├── hooks/                   # 이 페이지 전용 훅 (선택)
│   │   │   └── useHomeData.ts
│   │   ├── types.ts                 # 이 페이지 전용 타입 (선택)
│   │   ├── utils/                   # 이 페이지 전용 유틸 (선택)
│   │   ├── api/                     # 이 페이지 전용 백엔드
│   │   │   ├── router.py            # FastAPI 라우터
│   │   │   └── queries.py           # SQL 쿼리 함수
│   │   └── README.md                # 이 기능 설명
│   │
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── components/
│   │   ├── api/
│   │   │   ├── router.py
│   │   │   └── queries.py
│   │   └── README.md
│   │
│   ├── settings/                    # 하위 페이지가 여러 개인 경우
│   │   ├── profile/
│   │   │   ├── page.tsx
│   │   │   └── api/
│   │   │       └── router.py
│   │   ├── notification/
│   │   │   ├── page.tsx
│   │   │   └── api/
│   │   │       └── router.py
│   │   └── _shared/                 # settings 내 공유 코드 (_로 시작)
│   │       └── SettingsLayout.tsx
│   │
│   └── login/
│       ├── page.tsx
│       └── api/
│           └── router.py
│
├── frontend/                        # Next.js 프로젝트
│   ├── src/
│   │   ├── app/                     # 라우팅 전용 (1줄 re-export)
│   │   │   ├── layout.tsx           # 최상위 레이아웃 (여기만 실제 코드)
│   │   │   ├── globals.css          # 전역 스타일
│   │   │   ├── page.tsx             # 루트 리다이렉트
│   │   │   ├── home/
│   │   │   │   └── page.tsx         # re-export만
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         # re-export만
│   │   │   └── ...
│   │   ├── components/              # 전역 공통 컴포넌트
│   │   │   ├── ui/                  # Button, Input 등 기본 UI
│   │   │   ├── common/              # Pagination, SearchButton 등
│   │   │   ├── charts/              # 차트 래퍼
│   │   │   └── layout/              # Sidebar, Header 등
│   │   ├── context/                 # 전역 Context
│   │   └── lib/                     # 전역 유틸리티
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
│
├── server/                          # FastAPI 공통
│   ├── main.py                      # 앱 초기화 + 라우터 등록만
│   ├── router_loader.py             # features 라우터 로더
│   ├── config.py                    # 환경 설정
│   ├── utils.py                     # 공통 유틸 (DB 헬퍼 등)
│   └── requirements.txt
│
├── package.json                     # 루트 스크립트 (dev, build 등)
└── README.md
```

---

## 3. 핵심 파일 설명

### 3.1 features/{기능}/api/router.py

각 기능의 FastAPI 라우터입니다. `prefix`로 API 경로를 지정합니다.

```python
# features/home/api/router.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/home", tags=["home"])

@router.get("/summary")
async def get_summary():
    from features.home.api.queries import get_summary_query
    # ... 쿼리 실행 및 응답 반환
    pass

@router.get("/stats")
async def get_stats():
    # ...
    pass
```

### 3.2 features/{기능}/api/queries.py

이 기능에서만 사용하는 SQL 쿼리를 모아둡니다.

```python
# features/home/api/queries.py
def get_summary_query(start_date: str, end_date: str) -> str:
    return f"""
        SELECT ...
        FROM ...
        WHERE date BETWEEN '{start_date}' AND '{end_date}'
    """
```

### 3.3 server/router_loader.py

`__init__.py` 없이 features 안의 Python 파일을 직접 로드하는 유틸리티입니다.

```python
# server/router_loader.py
import importlib.util
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent

def load_feature_router(feature_path: str):
    """features/{path}/api/router.py 를 __init__.py 없이 직접 로드.

    사용법:
        load_feature_router("home")           -> features/home/api/router.py
        load_feature_router("settings/profile") -> features/settings/profile/api/router.py
    """
    router_file = PROJECT_ROOT / "features" / feature_path / "api" / "router.py"
    if not router_file.exists():
        raise FileNotFoundError(f"Router not found: {router_file}")

    module_name = f"features.{feature_path.replace('/', '.')}.router"
    spec = importlib.util.spec_from_file_location(module_name, router_file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.router
```

### 3.4 server/main.py

앱 초기화와 라우터 등록만 담당합니다. 비즈니스 로직은 없습니다.

```python
# server/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.router_loader import load_feature_router

app = FastAPI(title="My Project API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Features 라우터 등록
app.include_router(load_feature_router("home"))
app.include_router(load_feature_router("dashboard"))
app.include_router(load_feature_router("settings/profile"))
app.include_router(load_feature_router("settings/notification"))
app.include_router(load_feature_router("login"))
```

### 3.5 frontend/src/app/{경로}/page.tsx (re-export)

Next.js는 `app/` 폴더 구조로 URL을 결정하므로, 이 파일이 필요합니다.
실제 코드는 features에 있고, 여기서는 1줄로 연결만 합니다.

```tsx
// frontend/src/app/home/page.tsx
export { default } from '@features/home/page';
```

### 3.6 frontend/tsconfig.json

`@features/` 경로 별칭을 추가해야 합니다.

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@features/*": ["../features/*"]
    }
  }
}
```

---

## 4. 새 기능 추가 절차

"사용자 관리" 기능을 추가하는 예시입니다.

### Step 1: features 폴더 생성

```
features/
└── user-management/
    ├── page.tsx
    ├── components/
    │   └── UserTable.tsx
    ├── types.ts
    ├── api/
    │   ├── router.py
    │   └── queries.py
    └── README.md
```

### Step 2: 백엔드 라우터 작성

```python
# features/user-management/api/router.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/user-management", tags=["user-management"])

@router.get("/list")
async def get_user_list():
    # ...
    pass
```

### Step 3: 프론트엔드 페이지 작성

```tsx
// features/user-management/page.tsx
'use client';

export default function UserManagementPage() {
    return <div>사용자 관리</div>;
}
```

### Step 4: Next.js 라우팅 연결

```tsx
// frontend/src/app/user-management/page.tsx
export { default } from '@features/user-management/page';
```

### Step 5: server/main.py에 라우터 등록

```python
app.include_router(load_feature_router("user-management"))
```

### Step 6: 사이드바에 메뉴 추가

`frontend/src/components/layout/Sidebar.tsx`의 메뉴 배열에 항목 추가.

---

## 5. 파일 위치 규칙

| 종류 | 위치 | 예시 |
|:---|:---|:---|
| 이 페이지에서만 쓰는 컴포넌트 | `features/{기능}/components/` | `UserTable.tsx` |
| 이 페이지에서만 쓰는 훅 | `features/{기능}/hooks/` | `useUserData.ts` |
| 이 페이지에서만 쓰는 타입 | `features/{기능}/types.ts` | `UserItem` 인터페이스 |
| 이 페이지에서만 쓰는 유틸 | `features/{기능}/utils/` | `printHandler.ts` |
| 이 페이지 전용 API | `features/{기능}/api/router.py` | `GET /api/user-management/list` |
| 이 페이지 전용 쿼리 | `features/{기능}/api/queries.py` | `get_user_list_query()` |
| **여러 페이지에서 쓰는 UI** | `frontend/src/components/` | `Button`, `Pagination` |
| **여러 페이지에서 쓰는 Context** | `frontend/src/context/` | `AuthContext` |
| **여러 페이지에서 쓰는 유틸** | `frontend/src/lib/` | `utils.ts` |
| **전역 백엔드 설정** | `server/config.py` | DB 연결, 환경변수 |
| **전역 백엔드 유틸** | `server/utils.py` | DB 쿼리 실행 헬퍼 |

**원칙**: 2개 이상 기능에서 사용하면 공통 폴더로, 1개 기능에서만 사용하면 해당 features 폴더로.

---

## 6. 도메인 그룹핑

관련 기능이 여러 개일 때는 도메인 폴더로 묶습니다.

```
features/
├── inventory/                    # 도메인 그룹
│   ├── location-info/            # 개별 기능
│   │   ├── page.tsx
│   │   └── api/
│   ├── location-history/
│   │   ├── page.tsx
│   │   └── api/
│   └── _shared/                  # 이 도메인 내 공유 코드 (_접두사)
│       └── InventoryLayout.tsx
```

**URL 매핑**: `features/inventory/location-info/` → `/inventory/location-info`

**re-export**: `frontend/src/app/inventory/location-info/page.tsx`  
→ `export { default } from '@features/inventory/location-info/page'`

---

## 7. 바이브코딩 작업 지시 예시

이 구조를 사용하면 AI에게 다음과 같이 지시할 수 있습니다:

| 작업 | 지시 |
|:---|:---|
| 기능 수정 | "features/home/ 에서 요약 카드에 퍼센트 표시 추가해줘" |
| API 추가 | "features/home/api/router.py 에 새 엔드포인트 추가해줘" |
| 새 기능 | "features/notification/ 폴더 만들고 알림 목록 페이지 구현해줘" |
| 버그 수정 | "features/inventory/location-info/ 에서 검색이 안 되는 문제 수정해줘" |

**포인트**: 항상 `features/{기능명}/` 을 명시하면 AI가 정확한 파일을 찾아 작업합니다.

---

## 8. 체크리스트: 새 프로젝트에 적용하기

1. [ ] 프로젝트 루트에 `features/` 폴더 생성
2. [ ] `server/router_loader.py` 생성 (3.3절 코드 복사)
3. [ ] `frontend/tsconfig.json`에 `@features/*` 경로 별칭 추가
4. [ ] `server/main.py`에서 `load_feature_router()` 사용
5. [ ] 첫 번째 기능을 `features/{이름}/`에 작성
6. [ ] `frontend/src/app/{경로}/page.tsx`에서 re-export
7. [ ] 브라우저 테스트
8. [ ] 나머지 기능 순차 추가

---

## 9. 주의사항

- **`__init__.py` 불필요**: `router_loader.py`가 `importlib.util`로 직접 로드하므로 features/ 안에 `__init__.py`를 넣지 않아도 됩니다.
- **`.py` 파일 무시**: Next.js/TypeScript는 `.py` 파일을 무시하므로 같은 폴더에 `.tsx`와 `.py`가 있어도 충돌하지 않습니다.
- **공통 코드 분리**: 2개 이상 기능에서 사용하는 코드가 생기면 즉시 공통 폴더(`frontend/src/components/`, `server/utils.py` 등)로 옮기세요.
- **features 내 Python에서 공통 코드 import**: `server/utils.py` 등을 사용하려면 `from server.utils import ...` 형태로 import합니다 (프로젝트 루트에서 실행하므로 경로 문제 없음).
