# Analysis Feature (Backend)

`features/analysis`는 분석 기능의 백엔드 책임(API, 도메인)을 담당합니다.

분석 프론트(UI)는 아래 경로로 이관되었습니다.

- `frontend/src/page/analysis/page.tsx`
- `frontend/src/page/analysis/components/*`
- `frontend/src/page/analysis/README.md`

## 구성

### 도메인

- `domain/lotto_rank.py`: 로또 6/45 등수 판정 (`rank_lotto_ticket`)

### API

- `api/router.py`: `/api/analysis/*` 엔드포인트
- `api/queries.py`: 분석 저장 API에서 사용하는 SQL 상수

### SQL 관리

- 분석/홈 API 쿼리는 각 feature의 `api/queries.py`에 상수로 관리합니다.

### JL 휠 엔진 (`api/jl_service/`)

| 모듈 | 역할 |
|------|------|
| `config.py` | 상수/프로파일/오프셋 |
| `physics.py` | 휠 물리 시뮬레이션 + 6휠 드로우 |
| `start_numbers.py` | 시작번호 전략 (previous/frequency/blended) |
| `dedup.py` | 중복 방지 (사전 다양화 + 사후 빈도 교체) |
| `generator.py` | 20세트 생성 파이프라인 |
| `analysis.py` | 당첨 비교/중복 인사이트 분석 |
| `search.py` | 파라미터 역탐색 (번호 → speed/decel) |

> import 경로는 기존과 동일: `from features.analysis.api.jl_service import X`

### 연구 스크립트

- 기존 `scripts/` 연구 스크립트는 제거되었습니다.
- 현재 분석 기능은 `api/` + `domain/` + `api/jl_service/` 중심으로 유지됩니다.

## API

| HTTP | 경로 | 설명 |
|------|------|------|
| GET | `/api/analysis/generate/wheel?count=20&draw_no=` | JL 휠 생성 (미저장) |
| POST | `/api/analysis/generate-and-save` | JL 휠 20세트 DB 저장 |
| GET | `/api/analysis/draw-duplicate-insight?draw_no=&count=` | 교체 전/후 중복 분석 |

> 로또는 난수 추첨이므로 당첨 보장 불가. 참고/실험용입니다.

