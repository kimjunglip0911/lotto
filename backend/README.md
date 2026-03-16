# Lotto Backend

FastAPI 기반의 로또 정보 관리 백엔드 서버입니다.

## 폴더 구조 (유지보수 시 참고)

```
backend/
├── main.py                 # FastAPI 앱 진입점
├── api/
│   └── routers/            # HTTP 라우터 (당첨·추첨 조회)
├── domain/
│   ├── models/             # Pydantic 스키마 등
│   └── services/
│       └── analysis/       # 10개 분석 기법 (순서통계, 융합, CDM, LSTM 등)
├── infrastructure/
│   └── persistence/        # DB 연결, 쿼리, schema, lotto.db
└── scripts/                # 실행 스크립트 (진입은 run_*.py 2개만)
    ├── run_technique_52.py # 기법 52회 1세트 생성·분석
    ├── run_fusion_52.py    # 융합 52회 생성·분석·튜닝
    └── README.md           # 스크립트 사용처 정리
```

- **API 추가/수정** → `api/routers/`
- **분석 로직/상수** → `domain/services/analysis/` (기법별 `*_service.py`)
- **DB/쿼리** → `infrastructure/persistence/`
- **배치·튜닝 실행** → `scripts/` (실제로 실행하는 건 `run_technique_52`, `run_fusion_52`만)

## __pycache__ 사용 안 함

- **진입점** `main.py`, `scripts/run_technique_52.py`, `scripts/run_fusion_52.py`, `scripts/tune_fusion_52_grid.py`, `scripts/generate_fusion_52.py`, `scripts/analyze_fusion_52.py` 상단에 `sys.dont_write_bytecode = True`를 넣어 두었습니다.  
  이 경로로 실행하는 한 이 프로젝트 소스에서는 `__pycache__`가 생성되지 않습니다.
- **전역**으로 끄려면 터미널에서 `set PYTHONDONTWRITEBYTECODE=1`(Windows) 또는 `export PYTHONDONTWRITEBYTECODE=1`(Mac/Linux) 후 실행하세요.
- `__pycache__` 폴더는 삭제해 두었으며, `.gitignore`에 포함되어 있어 커밋되지 않습니다.

## 주요 기능

- 로또 당첨 정보 조회 및 저장
- 추첨 세트 저장
- 10개 분석 기법 기반 52회 생성·분석·융합 튜닝

## 기술 스택

- **Framework**: FastAPI
- **Database**: SQLite3
- **Server**: Uvicorn

## 실행 방법

프로젝트 루트에서:
```bash
npm run dev
```
백엔드만 실행:
```bash
cd backend && python -m uvicorn main:app --reload
```

스크립트(기법/융합)는 `scripts/README.md` 참고.
