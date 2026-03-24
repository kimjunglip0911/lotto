# Lotto Backend

FastAPI 기반 백엔드 공통 계층입니다. 실제 기능 라우터는 `features/*/api/router.py`에서 로드합니다.

## 폴더 구조 (유지보수 시 참고)

```
backend/
├── main.py                 # FastAPI 앱 진입점
├── router_loader.py        # features 라우터 동적 로더
├── models.py               # 공통 Pydantic 모델 export
├── database.py             # 공통 DB 연결
├── domain/services/analysis/jl_service.py
├── infrastructure/persistence/
└── scripts/
```

- **API 추가/수정** → `features/<feature>/api/router.py`
- **JL 휠 로직/속도 프로파일** → `domain/services/analysis/jl_service.py`
- **52회 테스트 스크립트/이력** → `features/analysis/scripts/`

## __pycache__ 사용 안 함

- **진입점** `main.py` 상단에 `sys.dont_write_bytecode = True`를 넣어 두었습니다.  
  이 경로로 실행하는 한 이 프로젝트 소스에서는 `__pycache__`가 생성되지 않습니다.
- **전역**으로 끄려면 터미널에서 `set PYTHONDONTWRITEBYTECODE=1`(Windows) 또는 `export PYTHONDONTWRITEBYTECODE=1`(Mac/Linux) 후 실행하세요.
- `__pycache__` 폴더는 삭제해 두었으며, `.gitignore`에 포함되어 있어 커밋되지 않습니다.

## 주요 기능

- 로또 당첨 정보 조회/저장/수정/삭제
- 추첨 세트 조회/추천/저장
- 분석·생성 API: JL 휠(`GET /api/analysis/generate/wheel`), JL 휠 저장(`POST /api/analysis/generate-and-save`)
- JL 휠 관련 요약·이력은 `features/analysis/scripts/당첨 이력.md` 참고

## 기술 스택

- **Framework**: FastAPI
- **Database**: SQLite3
- **Server**: Uvicorn

## 테스트

현재 `tests/` 디렉터리는 비어 있습니다. 필요 시 `pytest`로 스모크 테스트를 추가하세요.

```bash
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v
```

## 실행 방법

프로젝트 루트에서:
```bash
npm run dev
```
백엔드만 실행:
```bash
python -m uvicorn backend.main:app --reload
```

