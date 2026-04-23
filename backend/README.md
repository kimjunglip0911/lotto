# Lotto Backend

FastAPI 기반 백엔드 공통 계층입니다. 실제 기능 라우터는 `features/*/api/router.py`에서 로드합니다.

## 폴더 구조 (유지보수 시 참고)

```
backend/
├── main.py                 # FastAPI 앱 진입점
├── router/recommend/router.py # Recommend API 라우터
├── router/home/router.py   # Home API 라우터
├── router_loader.py        # (레거시) features 라우터 동적 로더
├── sql/recommend/queries.py # Recommend SQL 쿼리 상수
├── sql/home/queries.py     # Home SQL 쿼리 상수
├── models.py               # 공통 Pydantic 모델 export
├── database.py             # 공통 DB 연결
└── infrastructure/persistence/
```

- **SQLite 경로**: [`database.py`](database.py)의 `get_db_path()`는 `infrastructure/persistence/lotto.db` 한 경로만 사용합니다(`init_db.py` 출력과 동일).
- **공통 Pydantic**: [`domain/models/schemas.py`](domain/models/schemas.py)는 [`models.py`](models.py)를 통해 노출되며, 현재는 `MessageResponse`, `GenerateSaveRequest`만 둡니다.
- **Home API 추가/수정** → `backend/router/home/router.py`
- **Home SQL 쿼리 수정** → `backend/sql/home/queries.py`
- **Recommend API 추가/수정** → `backend/router/recommend/router.py`
- **Recommend SQL 쿼리 수정** → `backend/sql/recommend/queries.py`
- **JL 휠 로직/속도 프로파일** → `features/analysis/api/jl_service/`
- **JL 분석 엔진** → `features/analysis/api/jl_service/`

## __pycache__ 사용 안 함

- **진입점** `main.py` 상단에 `sys.dont_write_bytecode = True`를 넣어 두었습니다.  
  이 경로로 실행하는 한 이 프로젝트 소스에서는 `__pycache__`가 생성되지 않습니다.
- 루트 `package.json`의 `npm run dev:backend`는 `python -B -m uvicorn ...`로 실행되어 바이트코드 생성이 한 번 더 차단됩니다.
- **전역**으로 끄려면 터미널에서 `set PYTHONDONTWRITEBYTECODE=1`(Windows) 또는 `export PYTHONDONTWRITEBYTECODE=1`(Mac/Linux) 후 실행하세요.
- `__pycache__` 폴더는 삭제해 두었으며, `.gitignore`에 포함되어 있어 커밋되지 않습니다.

## __init__.py 미사용 정책

- 이 저장소는 PEP 420 네임스페이스 패키지 방식으로 동작하므로 `__init__.py` 파일을 사용하지 않습니다.
- 신규 파일 추가/리팩터링 시 패키지 경계에 `__init__.py`를 만들지 마세요.
- 재도입 방지를 위해 루트에서 아래 검증 명령을 사용합니다.

```bash
npm run check:no-init
```

## 주요 기능

- 로또 당첨 정보 조회/저장/수정/삭제
- 추첨 세트 조회/추천/저장
- 추천·생성 API: JL 휠(`GET /api/recommend/generate/wheel`), JL 휠 저장(`POST /api/recommend/generate-and-save`)
- 추천 제외 후보 API: `GET /api/recommend/exclusion-candidates` (전체/기간별 번호 빈도 기반 제외 후보 계산)
- `POST /api/recommend/generate-and-save` 요청 본문은 `draw_no` 외에 `applied_rule_ids`, `excluded_numbers`를 선택적으로 받을 수 있습니다.
- `features` 기반 JL 서비스가 없는 환경에서는 추천 생성 API가 fallback 랜덤 생성 로직으로 동작합니다.
- JL 휠 관련 로직은 `features/analysis/api/jl_service/`에서 확인할 수 있습니다.

## 기술 스택

- **Framework**: FastAPI
- **Database**: SQLite3
- **Server**: Uvicorn

## 프레임워크·라이브러리 설정

이 폴더에서 다루는 **웹 프레임워크 조립**과 **Python 의존성 목록**은 아래와 같습니다.

| 구분 | 위치 | 내용 |
|------|------|------|
| FastAPI 앱·미들웨어 | [`main.py`](main.py) | `FastAPI()` 인스턴스, `CORSMiddleware`(origins/methods/headers), `include_router`로 기능 라우터 마운트 |
| 라우터 마운트 | [`router_loader.py`](router_loader.py) | `features/<기능>/api/router.py` 동적 로드 (프레임워크와 기능 모듈 연결) |
| Python 패키지 | [`requirements.txt`](requirements.txt) | 런타임: `fastapi`, `uvicorn[standard]`, `pydantic`, `torch` |
| 로컬 개발 서버 (Node) | 저장소 루트 `package.json` | `npm run dev:backend` → `python -B -m uvicorn backend.main:app`, `--reload-dir backend`, `--reload-dir features` |

**역할 분리 참고**: 엔드포인트 구현·DB 접근·공통 Pydantic 스키마는 `features/` 및 본 디렉터리의 `database.py`, `domain/models/`, `infrastructure/` 등에서 담고, 분석 기능의 등수 판정은 `features/analysis/domain/` 에 둡니다. 위 표는 **HTTP 서버 골격과 라이브러리 선언**에 해당합니다.

## 실행 방법

프로젝트 루트에서:
```bash
npm run dev
```
백엔드만 실행:
```bash
python -B -m uvicorn backend.main:app --reload
```

