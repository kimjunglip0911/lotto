# Analysis Feature (Backend)

`features/analysis`는 분석 기능의 백엔드 책임(API, 도메인, 스크립트)을 담당합니다.

분석 프론트(UI)는 아래 경로로 이관되었습니다.

- `frontend/src/page/analysis/page.tsx`
- `frontend/src/page/analysis/components/*`
- `frontend/src/page/analysis/README.md`

## 구성

### 도메인

- `domain/lotto_rank.py`: 로또 6/45 등수 판정 (`rank_lotto_ticket`)

### API

- `api/router.py`: `/api/analysis/*` 엔드포인트
- `api/queries.py`: 저장용 SQL

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

### 연구 스크립트 (`scripts/`)

- `run_00_cumulative_winners.py`: 누적 당첨 번호 집계(1~N) 후 상위/하위 번호 산출
- `run_01_pick_offset_start.py`: 직전회차(P)-현재회차(C) 오프셋 산출 및 추천 번호 생성
- `run_02_three_year_single_set.py`: 최신 52회차 단일 세트 평가, `당첨 이력.md` 갱신
- `jl_wheel_batch_eval.py`: 배치 평가/이력 포맷 보조 유틸
- `당첨 이력.md`: 최신 52회차 평가 결과 문서

## API

| HTTP | 경로 | 설명 |
|------|------|------|
| GET | `/api/analysis/generate/wheel?count=20&draw_no=` | JL 휠 생성 (미저장) |
| POST | `/api/analysis/generate-and-save` | JL 휠 20세트 DB 저장 |
| GET | `/api/analysis/draw-duplicate-insight?draw_no=&count=` | 교체 전/후 중복 분석 |

> 로또는 난수 추첨이므로 당첨 보장 불가. 참고/실험용입니다.

