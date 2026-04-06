# Analysis Feature

JL 휠 기반 번호 생성/저장/중복 인사이트 분석을 담당합니다.

## 구성

### UI
- `page.tsx`: 분석 페이지 UI 엔트리
- `components/AnalysisController.tsx`: 생성/조회 컨트롤 UI
- `components/AnalysisResultList.tsx`: 세트 카드 리스트 렌더링

### API
- `api/router.py`: `/api/analysis/*` 엔드포인트
- `api/queries.py`: 저장용 SQL

### JL 휠 엔진 (`api/jl_service/`)

914줄 단일 파일에서 역할별 7개 모듈로 분리:

| 모듈 | 역할 |
|------|------|
| `config.py` | 상수·프로파일·오프셋 (튜닝 시 이 파일만 수정) |
| `physics.py` | 휠 물리 시뮬레이션 + 6휠 드로우 |
| `start_numbers.py` | 시작번호 전략 (previous/frequency/blended) |
| `dedup.py` | 중복 방지 (사전 다양화 + 사후 빈도 교체) |
| `generator.py` | 20세트 생성 파이프라인 |
| `analysis.py` | 당첨 비교·중복 인사이트 분석 |
| `search.py` | 파라미터 역탐색 (번호 → speed/decel) |

> import 경로는 기존과 동일: `from features.analysis.api.jl_service import X`

### 연구 스크립트 (`scripts/`)
- `run_01_pick_offset_start.py`: 1등 offset·시작 배치 선정 — P의 본6+보너스 7풀에서 6휠 `P(7,6)=5040` × offset 45 → pick JSON (총 226,800 후보)
- `run_02_three_year_single_set.py`: pick 기준 단일 세트 약 3년치 평가 → `당첨 이력.md`
- `jl_wheel_batch_eval.py`: 가변 회차 배치 평가·이력 포맷·config 반영 헬퍼
- `당첨 이력.md`: 단일 세트 3년치 평가 결과(2번 스크립트가 덮어씀)
- `연구 분석 결과.md`: 과거 연구 메모(레거시 `run_research`/`run_multi_seed`는 제거됨)

## 스크립트 사용법

### 1등 offset 선정 워크플로 (요약)
```
python -m features.analysis.scripts.run_01_pick_offset_start --prev-draw 1217 --current-draw 1218 --set-index 1 --write-pick pick.json
python -m features.analysis.scripts.run_02_three_year_single_set --pick-json pick.json --write-history "features/analysis/scripts/당첨 이력.md"
```
자세한 절차는 `.agents/workflows/01.1등당첨.md` 참고.

## API

| HTTP | 경로 | 설명 |
|------|------|------|
| GET | `/api/analysis/generate/wheel?count=20&draw_no=` | JL 휠 생성 (미저장) |
| POST | `/api/analysis/generate-and-save` | JL 휠 20세트 DB 저장 |
| GET | `/api/analysis/draw-duplicate-insight?draw_no=&count=` | 교체 전/후 중복 분석 |

> 로또는 난수 추첨이므로 당첨 보장 불가. 참고·실험용입니다.
