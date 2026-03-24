# Analysis Services

## JL 휠 시뮬레이션 (`jl_service.py`)

- **시작 6번호(기본)**: 대상 회차 `draw_no`의 **직전 회차(`draw_no-1`) 당첨 본번호 6개** (`get_previous_draw_winning_starts(draw_no)`).
- **배치(52회차 시뮬, `run_wheel_52`)**: 각 평가 회차마다 해당 회차의 **직전 회차 당첨번호 6개**를 시작번호로 사용. 회차 내 세트 생성은 실제 생성과 동일하게 `generate_jl_wheel_sets(..., dedup_across_sets=True)` 를 사용해 세트 중복을 사후 교체 규칙으로 해소.
- **20단계 초기 speed** (`TWENTY_BASE_SPEEDS`) + 정지 시간 고정.

- **물리 모델**: `이동거리 = speed² / (2×deceleration)`, 정지 시간 `speed/deceleration`, 정지 번호 `(시작-1+int(거리)) % 45 + 1`
- **교체 전 중복 최소화 (`prevent_duplicates_before_replace=True`, 기본)**: 세트 생성 단계에서 시작번호를 세트별로 회전/변형하고, 중복 조합이면 speed를 미세 조정해 재생성합니다.
- **세트 간 조합 중복 사후 방지 (`dedup_across_sets=True`)**: 교체 전 최소화 이후에도 중복이 남으면, 세트 #1은 유지하고 #2~#20에서 중복 여부를 확인합니다. 중복이면 해당 세트 6개 중 **누적 당첨 빈도가 가장 높은 번호 1개**를, 빈도 하위 20개 번호 풀의 **낮은 번호부터 순차** 교체합니다(요청 규칙). 교체 후에도 중복이면 다음 번호로 반복합니다.
- **정지 시간 고정**: `FIXED_STOP_TIME` — `features/analysis/scripts/당첨 이력.md` 과거 결과 중 **세트#2**(4등·5등 포함) 명목 `82.11/1.88` → `speed÷decel`. 세트별 `deceleration = speed / FIXED_STOP_TIME` (재시도 지터 시에도 해당 시도의 speed에 대해 동일 식).
- **상수**: `TWENTY_BASE_SPEEDS` — 속도 20종 튜닝 시 여기만 수정. 예전처럼 (speed, decel) 독립 쌍을 쓰려면 `generate_jl_wheel_sets(..., fixed_stop_time=None)`.
- **현재 기본 speed(2026-03-20 반영)**: `--tune-reconcile --tune-delta 0.15 --seed 42` 결과  
  `81.06, 82.11, 84.36, 86.47, 90.54, 90.9, 92.42, 92.43, 92.44, 98.6, 98.61, 98.62, 98.63, 108.92, 108.93, 109.08, 113.23, 113.57, 119.22, 121.43`
- **등수 판정**: `domain/services/lotto_rank.py` 의 `rank_lotto_ticket` (본번호·보너스 대비 1~5등).
- **주요 함수**: `get_previous_draw_winning_starts`, `get_global_top6_frequency_starts`(하위호환), `get_top6_frequency_starts`(하위호환), `generate_jl_wheel_sets`, `generate_wheel_sets`, `simulate_wheel_continuous`
- **심층 분석 함수**: `analyze_draw_duplicate_sets(draw_no)` — 교체 전(원시/다양화)·교체 후 중복 그룹, 당첨 세트 번호/등수를 함께 반환

### 튜닝

- **무당첨 세트 speed**: `당첨 이력.md`에서 `-` 인 세트 → `python -m features.analysis.scripts.run_wheel_52 --seed 42 --refine-set N --refine-step 0.01 --write-history features/analysis/scripts/당첨 이력.md` 로 해당 세트만 이웃 speed 구간 그리드 탐색(다른 세트 기준 대비 악화 불가). 52회 배치는 실제 생성과 동일하게 `dedup_across_sets=True`.
- **5등 1회만 세트(작업지시 1, 기본)**: 표에서 당첨이 **정확히 1건이고 5등만**인 세트 → 이웃 상한 쪽으로 speed **`tune-delta` 만큼** 1차 상향 후 `run_wheel_52 --tune-reconcile`.
- **5등만 정확히 2회 세트(레거시 옵션)**: 표에서 당첨이 **2건이고 모두 5등**(3·4등 없음)인 세트 → `run_wheel_52 --tune-reconcile --tune-double-fifth`.
- **악화 세트 처리(작업지시 2·3)**: 튜닝 이후 기준 대비 악화 세트는 해당 세트만 **기준 speed 복구 + 반대 방향 2차 재튜닝**을 1회 수행합니다. 2차 폭은 `--tune-alt-delta`(미지정 시 `--tune-delta`와 동일)로 제어합니다.
- **품질 판정 기준**: 세트 품질 비교는 `(1~5등 개수)`에 대한 **가중치 점수식**을 사용하며, 상위 등수 1건이 다수의 하위 등수보다 항상 우선됩니다.
- **5등 2회만 세트(레거시)**: `--tune-double-fifth` 로 예전 규칙 선택.
  - 롤백이 잦으면 **`--tune-delta 0.15`**. 상향만으로는 한계인 세트는 **이웃 구간 0.01 그리드 탐색**(세트#18 `113.57` 사례).

### 실행·문서

- 세트별 당첨 이력 표(고정 양식): `python -m features.analysis.scripts.run_wheel_52` → `features/analysis/scripts/당첨 이력.md` 전체 갱신.
- **광역 속도 탐색(권장 검증 루틴)**:  
  `python -m features.analysis.scripts.run_wheel_52 --seed 42 --refine-all --refine-min-speed 75 --refine-max-speed 130 --refine-step 0.5 --write-history features/analysis/scripts/당첨 이력.md`
- **튜닝+악화 롤백(작업지시 1·2)**:  
  `python -m features.analysis.scripts.run_wheel_52 --seed 42 --tune-reconcile --tune-delta 0.15 --tune-alt-delta 0.1 --write-history features/analysis/scripts/당첨 이력.md`  
  기준은 실행 시점의 `TWENTY_BASE_SPEEDS` 스냅샷, **5등 1회만** 세트를 1차 조정 후 기준보다 나빠진 세트만 **반대 방향 2차 재튜닝**합니다. 콘솔 배열을 **`jl_service.TWENTY_BASE_SPEEDS`에 반영**해 재현합니다.
- API·저장: `GET .../generate/wheel`, `POST .../generate-and-save` → `generate_jl_wheel_sets` / `generate_wheel_sets`.
- 중복 심층 분석 API: `GET /api/analysis/draw-duplicate-insight?draw_no=1216&count=20` → 교체 전/후 동일 세트 그룹 및 당첨 세트 번호 반환.

### 테스트

- 튜닝 정책/가중치·이력 양식 검증: `pytest tests/test_run_wheel_52_tuning.py`
- 세트 중복 사후 교체 규칙 검증: `pytest tests/test_jl_service_dedup.py`

### API (라우터)

- `GET /api/analysis/generate/wheel?count=20&draw_no=` — JL 휠 생성 (미저장)
- `POST /api/analysis/generate-and-save` — JL 휠 20세트 DB 저장 (`method`: `JL 휠 (20) 저장`)

> 로또는 난수 추첨이므로 당첨 보장 불가. 참고·실험용입니다.
