# Lotto Backend

FastAPI 기반 백엔드 공통 계층입니다. 실제 기능 라우터는 `features/*/api/router.py`에서 로드합니다.

## 폴더 구조 (유지보수 시 참고)

```
backend/
├── main.py                 # FastAPI 앱 진입점
├── router/recommend/
│   ├── router.py             # Recommend API 엔드포인트 조립
│   ├── repository.py         # Recommend DB 접근 레이어
│   ├── queries.py            # Recommend SQL 쿼리 상수
│   ├── helpers.py            # Recommend 순수 계산/변환 로직
│   └── jl_loader.py          # JL 서비스 로더 + fallback
├── router/home/
│   ├── router.py             # Home API 라우터
│   └── queries.py            # Home SQL 쿼리 상수
├── router/analysis/*/queries.py # Analysis SQL 쿼리 상수
├── DB/
│   ├── database.py            # 공통 DB 연결
│   ├── init_db.py             # DB 초기화 스크립트
│   ├── schema.sql             # SQLite 스키마
│   └── lotto.db               # 로컬 DB 파일(.gitignore)
```

- **SQLite 경로**: [`DB/database.py`](DB/database.py)의 `get_db_path()`는 기본 `DB/lotto.db`이며, 환경 변수 `LOTTO_DB_PATH`가 있으면 그 절대 경로를 씁니다.
- **공통 Pydantic**: [`domain/models/schemas.py`](domain/models/schemas.py)를 단일 정본으로 사용하며, `MessageResponse`, `GenerateSaveRequest`, 누적번호 최종 4개 저장(`AccumulatedNumberSnapshotSaveRequest` 등)을 포함합니다.
- **누적번호 분석 API**: [`router/analysis/accu-nums/router.py`](router/analysis/accu-nums/router.py), SQL [`queries.py`](router/analysis/accu-nums/queries.py), 최종 번호 4개만 DB에 쓰는 [`repository.py`](router/analysis/accu-nums/repository.py). 베이스 경로는 `/api/analysis/accu-nums/`이며, 구 URL `/api/analysis/accumulated-numbers/`도 동일 동작으로 유지한다(OpenAPI에는 신규만 표시). 저장소를 당겨온 뒤에는 Uvicorn 프로세스를 재기동해야 새 경로가 반영된다.
- **Home API 추가/수정** → `backend/router/home/router.py`
- **Home SQL 쿼리 수정** → `backend/router/home/queries.py`
- **Recommend API 추가/수정** → `backend/router/recommend/router.py`
- **Recommend 내부 로직 분리**
  - DB 접근/트랜잭션 → `backend/router/recommend/repository.py`
  - 번호 계산/치환 로직 → `backend/router/recommend/helpers.py`
  - JL 서비스 로더/fallback → `backend/router/recommend/jl_loader.py`
- **Recommend SQL 쿼리 수정** → `backend/router/recommend/queries.py`
- **JL 휠 로직/속도 프로파일** → `features/analysis/api/jl_service/`
- **JL 분석 엔진** → `features/analysis/api/jl_service/`

## Home 라우터 리팩터링 원칙

- `backend/router/home/router.py`는 API 계약(경로, 파라미터, 응답 스키마)을 유지한 상태에서 내부 구현만 정리합니다.
- Home SQL 본문과 파라미터는 `backend/router/home/queries.py`를 단일 정본으로 사용하며, 라우터 리팩터링에서 쿼리 상수는 변경하지 않습니다.
- 라우터 내부에서는 DB 실행/연결 종료 중복을 헬퍼로 통일하고, 추천 조합 로직은 순수 함수로 분리해 가독성과 유지보수성을 높입니다.
- 예외 처리는 `HTTPException` 재전파, 일반 예외 500 변환 원칙을 유지합니다.

## Analysis 라우터 구현 관례

- `backend/router/analysis/*/router.py`는 `backend/router/analysis/_shared.py`를 통해 SQL 모듈을 동적으로 로드하고, `backend/router/analysis/*/queries.py` 상수를 사용합니다.
- DB 실행은 `fetch_all`, `fetch_one` 기반 공통 헬퍼(`fetch_draw_numbers`, `fetch_dict_or_404`, `fetch_dict_rows`)를 우선 사용해 연결 종료와 응답 변환을 일관되게 유지합니다.
- 라우터는 엔드포인트 계약(파라미터 검증, 404/400 분기, 응답 shape)에 집중하고, 인프라성 중복(로딩/조회/500 변환)은 `_shared.py`로 유지합니다.
- 예외 처리 시 `HTTPException`은 의미를 보존해 그대로 재전파하고, 일반 예외만 `run_with_http_500` 경유로 500으로 변환합니다.

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
| 라우터 마운트 | [`main.py`](main.py) | `include_router`와 `load_router_from_file`로 기능 라우터 동적 로드 |
| Python 패키지 | [`requirements.txt`](requirements.txt) | 런타임: `fastapi`, `uvicorn[standard]`, `pydantic`, `torch` |
| 로컬 개발 서버 (Node) | 저장소 루트 `package.json` | `npm run dev:backend` → `python -B -m uvicorn backend.main:app`, `--reload-dir backend`, `--reload-dir features` |

**역할 분리 참고**: 엔드포인트 구현·DB 접근·공통 Pydantic 스키마는 `features/` 및 본 디렉터리의 `DB/database.py`, `domain/models/`, `DB/` 등에서 담고, 분석 기능의 등수 판정은 `features/analysis/domain/` 에 둡니다. 위 표는 **HTTP 서버 골격과 라이브러리 선언**에 해당합니다.

## 실행 방법

프로젝트 루트에서:
```bash
npm run dev
```
백엔드만 실행:
```bash
python -B -m uvicorn backend.main:app --reload
```

