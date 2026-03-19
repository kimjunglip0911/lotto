# Analysis Services

**JL3 기법**(`jl_service3.py`) 중심의 로또 번호 분석입니다.  
`jl_service.py`는 JL3가 **공통 헬퍼**로 import하는 모듈입니다(역사적 JL 단일 기법 구현·상수가 함께 포함되어 있으나, 스크립트 진입점은 JL3만 제공합니다).

## 진입 스크립트

- **JL3 기법 52회 검증** (상위 8개 → 28세트 전수): `python -m scripts.run_jl3_52` / `--analyze-only` / `--draw-start`·`--draw-end`(52회 구간)
- **JL3 앵커 랜덤 프로브 (§4.4)**: `python -m scripts.run_jl3_anchor_random`
- **JL3 다구간 안정성 (§4.5)**: `python -m scripts.run_jl3_multi_window`
- **JL3 실구매 2차 랭킹 (§4.6)**: `python -m scripts.run_jl3_combo_rank --draw-no N`
- **JL3 파라미터 민감도 분석** (DEFAULTS ±20% 당첨회차·점수 변동): `python -m scripts.run_jl3_sensitivity` / `--perturb 0.1`
- **JL3 튜닝 단위 테스트** (정렬·필터 키 분리): `python -m pytest tests/test_jl3_tune.py -v` (`backend` 디렉터리)

**실행 위치**: `backend` 디렉터리.

## jl_service.py (JL3 연동)

JL3(`jl_service3.py`)에서 다음을 import합니다.

- `_fetch_rows` — 회차별 당첨 번호 조회
- `_compute_max_gap_and_current`, `_dynamic_gap_exponential_scores` — 갭·지수 가속
- `_zone_balance_scores`, `_neighbor_momentum_scores`, `_recent_trend_scores`, `_last_draw_bonus_scores` — 구간·이웃·트렌드·직전회차

JL 확장 파라미터는 `jl_service3.get_analysis(...)` 키워드 인자로 오버라이드합니다.

## JL3 기법 (jl_service3.py)

슬라이딩 윈도우 기반 독자 분석. **TOP_N=8 고정**, 상위 8개 번호 추출 후 **C(8,6)=28세트** 전수 조합을 생성합니다.  
**JL 확장**: 이웃 모멘텀·구간 균형·최근 트렌드·직전 회차 보너스를 선택적으로 결합할 수 있으며, 갭 점수는 선형(기본) 또는 지수 가속(use_gap_exponential)으로 전환 가능합니다.

### 7가지 규칙

| 규칙 | 내용 |
|------|------|
| 1+2 | 회차당 1주, 윈도우(WINDOW_SIZE) 회차. 회차 증가 시 윈도우 자동 조정. |
| 3 | 번호별 출현 횟수 평균 이상 → 감점, 이하 → 가점. |
| 4 | 같은 번호 연속 출현 스트릭이 역대 최대에 근접할수록 감점. |
| 5 | 연속 출현 후 쿨다운(역대 최소 미출현 회차) 기간 동안 해당 번호 제외. |
| 6 | 45개 번호의 현재 미출현 갭 평균(갭=1 제외) 대비: 갭 > 평균(오래 안 나옴) → 가점, 갭 < 평균 → 감점. |
| 7 | 현재 미출현 갭이 역대 최대를 초과하면 강제 선정. |

### 조정 가능 상수 (jl_service3.py 상단, Round2 Phase C 반영)

| 상수 | 설명 | 기본값 |
|------|------|--------|
| WINDOW_SIZE | 분석 윈도우 회차 수 | 390 |
| RECENT_N | JL 확장 팩터(이웃·구간·트렌드) 분석용 최근 회차 수 | 3 |
| TOP_N | 상위 추출 번호 수 (28세트 = C(8,6)) | 8 |
| MIN_ROWS | 최소 분석 회차 (미달 시 균등 점수) | 20 |
| FREQ_BELOW_AVG_SCALE | 평균 이하 가점 계수 | 2.3 |
| FREQ_ABOVE_AVG_SCALE | 평균 이상 감점 계수 | 0.5 |
| STREAK_NEAR_MAX_PENALTY | 연속 스트릭 근접 시 최소 배율 | 0.45 |
| GAP_ABOVE_AVG_BONUS_SCALE | 갭 > 평균 시 가점 강도 | 1.162 |
| GAP_BELOW_AVG_PENALTY_SCALE | 갭 < 평균 시 감점 강도 | 0.82 |

### 사용

- `get_analysis(draw_no, ...)`: `scores`, `excluded`, `force_selected`, `top8`, `combinations`, `rows` 반환. 키워드 인자로 window_size, recent_n, use_gap_exponential, 갭 지수·이웃·구간·트렌드·직전회차 파라미터 오버라이드 가능.
- `get_scores(draw_no, ...)` / `get_top8(draw_no, ...)`: 동일 인자로 튜닝용 오버라이드 지원.
- `generate_combinations(draw_no, ...)`: 상위 8개에서 C(8,6)=28개 조합 생성. **기본**으로 동적 합계·홀짝 필터 적용. `apply_sum_filter=False`, `apply_odd_even_filter=False`로 비활성화 가능.

### 동적 합계·홀짝 필터

- **합계**: 윈도우(WINDOW_SIZE) 내 당첨번호 6개 합의 최소·최대를 구해, 그 범위 안에 있는 조합만 남김.
- **홀짝**: 윈도우 내 회차별 홀수 개수(0~6) 빈도를 계산하고, 출현 비율이 1% 미만인 홀짝 비율은 제외(ODD_EVEN_MIN_RATIO). 필터 적용 시 회차당 28세트 미만이 될 수 있음.

### 52회 검증 (run_jl3_52.py)

- 회차당 28세트(상위 8개 전수 조합) 생성 후 당첨번호와 비교.
- 합격선: 당첨 발생 회차 수 ≥ 52회.
- **병목 진단**: `python -m scripts.run_jl3_52 --diagnose` 로 상위 8개에 당첨번호가 몇 개 포함되는지 회차별 집계(이론적 상한 확인). 동일 로직은 `compute_top8_coverage_metrics()` 로 스크립트에서 재사용 가능.
- **다른 52회 구간 DB 검증**: `python -m scripts.run_jl3_52 --draw-start A --draw-end B` (포함 구간 길이 정확히 52회).
- **메모리 전용 평가**: `evaluate_jl3_params_on_draws_in_memory(draw_nos, params)` — DB `lotto_drawings` 없이 조합 생성·등수 집계(다구간·앵커 랜덤 프로브용).

### 플랜 §4.4~4.6 (선택·고비용)

| 항목 | 스크립트 / API | 설명 |
|------|----------------|------|
| §4.4 앵커 랜덤 | `python -m scripts.run_jl3_anchor_random` | `phase3_best.json` 주변 ±`rel` 무작위 N회, 메모리 평가. 결과 `jl3_tune_state/anchor_random_top5.json` |
| §4.5 다구간 | `python -m scripts.run_jl3_multi_window` | 동일 params로 연속 52회 구간 여러 곳 점수·당첨회차 분산. `jl3_tune_state/multi_window_eval.json` |
| §4.6 실구매 랭킹 | `secondary_purchase_score`, `rank_jl3_combos_for_purchase`, `run_jl3_combo_rank` | 28세트 구조 유지, k세트만 고를 때 2차 휴리스틱(합·구간·홀짝·연번). 당첨 보장 없음. |
| Phase0 확장(고비용) | `python -m scripts.run_jl3_auto_tune --phase 0 --phase0-wide --phase0-only` | 5×5=25회 구조 그리드만 평가 후 종료. **`--phase0-only` 없이 `--phase 0`만 쓰면 Phase 1~3까지 이어서 전체 파이프라인이 실행됨.** |

### JL3 자동 튜닝 (run_jl3_auto_tune.py)

**목표(작업지시.md)**: 52회차 기준 등수별 당첨 발생 회차 수 — 1등 1번, 2등 1번, 3등 12번, 4등 24번, 5등 52번. `DEFAULTS`에 `apply_sum_filter` / `apply_odd_even_filter` 및 `sum_margin_ratio` / `odd_even_min_ratio` 로 동적 필터 튜닝.

**미세조정 절차**: (1) `run_jl3_52 --diagnose` 로 Top8 적중률 병목 확인 (2) `run_jl3_sensitivity` (3) Phase 0→1→2→3 또는 Round2 Phase A→B→C.

**정렬 키(`_result_sort_key`)**: 등수 목표 충족 개수 → 가중 점수 → 당첨 회차 수 → **Top8에 당첨 3개 이상 포함된 회차 수(`draws_with_ge3`)** → 동일하게 `draws_with_ge4` → 목표 거리(`_target_distance`). Phase 0/3/C 최적 선택도 동일 기준을 사용합니다.

**4단계 계층적 탐색** (Phase 0~3) + **Round2 JL 확장 탐색** (Phase A/B/C).

- **Phase 0**: 구조 파라미터 그리드 탐색 (window_size × recent_n) → `phase0_best.json`
- **Phase 1**: 기존 5개 파라미터 독립 스윕(현재 최적값 주변 촘촘한 그리드) → 상위 3개 후보 `phase1_top3.json`
- **Phase 2**: 3^5 = 243 조합 전수 탐색, 재시작 지원 → `results.json`
- **Phase 3**: Phase 2 상위 5개 주변 ±7% 미세 조정(파라미터당 7단계) → `phase3_best.json`

**Round2 (합격선 근접용)**  
- **Phase A**: JL 확장(이웃/구간/트렌드/직전회차/갭지수) 독립 스윕(0 근처 미세 구간 포함) → `phase_a_top3.json`  
- **Phase B**: Phase A best_jl + Phase 1 Top3 기반 3^5 그리드 → `results.json`  
- **Phase C**: Phase B 상위 5개 주변 ±10% 미세 조정(파라미터당 7단계) → `phase_c_best.json`

평가: 위 정렬 키 순서(가중 점수·당첨 회차·ge3/ge4·목표 거리 포함). `results.json` 각 항목에 `draws_with_ge3`, `draws_with_ge4` 필드가 저장됩니다.

실행 예: `python -m scripts.run_jl3_auto_tune` (0→1→2→3 전체) / `--phase 1` / `--phase a` / `--phase b` / `--phase c` / `--phase 2 --resume` / `--stop-on-pass`

Phase 3 또는 Phase C 완료 후 해당 best JSON을 `jl_service3.py` 상수에 반영한 뒤 `python -m scripts.run_jl3_52`로 재검증합니다.

### 다양한 각도 수치 조정 (합격선 다양화)

같은 합격선이 반복될 때 탐색 다양화 및 새로운 조정 축을 사용합니다.

| 구분 | 내용 |
|------|------|
| **확장 그리드** | `--phase0-wide`: Phase 0에서 window_size [100,180,260,390,520], recent_n [2,4,6,9,12] 사용. |
| **Coarse 탐색** | `--phase1-coarse`: Phase 1 넓은 범위 그리드(PHASE1_GRID_COARSE) 사용. |
| **상위 후보 확대** | `--phase1-top 5`: Phase 1에서 파라미터당 상위 5개 저장 → Phase 2에서 3개로 압축해 3^5 유지. |
| **Phase 3 범위** | `--phase3-perturb 0.15`: Phase 3 미세 조정 ±15% (기본 ±7%). |
| **동적 필터·갭지수** | Phase A에 `sum_margin_ratio`, `odd_even_min_ratio`, `gap_threshold_ratio`, `gap_exp_scale`, `gap_linear_below` 그리드 포함. |
| **완화 합격** | `--relaxed-pass 50`: 당첨 발생 회차 수 ≥ 50이면 합격으로 간주해 후보 수집. |
| **정렬** | 등수 목표 충족 → 가중 점수 → 당첨 회차 수 → `draws_with_ge3` → `draws_with_ge4` → 목표 거리. |

**민감도 분석**: `python -m scripts.run_jl3_sensitivity` (기본 ±20%). 파라미터별 당첨 회차 수·가중 점수 변동폭을 보고, 변동폭이 큰 파라미터를 Phase 1/2에서 더 촘촘히 탐색하는 것을 권장합니다.

**테스트**: `backend` 디렉터리에서 `python -m pytest tests/test_jl3_tune.py -v` (튜닝 헬퍼·정렬 키, DB 불필요).

**플랜 보완 실행 결과(진단·4분면·민감도·재검증)**: [`backend/docs/JL3_plan_completion_결과.md`](../../../docs/JL3_plan_completion_결과.md)  
**전체 파이프라인 완료(Phase0~3 + Round2 A~C + 상수 반영)**: [`backend/docs/JL3_full_pipeline_완료보고.md`](../../../docs/JL3_full_pipeline_완료보고.md)

**권장 실행 순서**: (1) `run_jl3_52 --diagnose` 로 Top8 병목 확인 (2) `run_jl3_sensitivity` 로 민감도 확인 (3) `--phase0-wide` 또는 `--phase1-coarse` 로 넓은 탐색 (4) `--phase1-top 5` 및 `--phase3-perturb 0.15` 적용 (5) `--relaxed-pass 50` 으로 목표에 가까운 후보까지 수집 후 best JSON 반영 및 재검증.

> **참고**: 로또는 난수 추첨이므로 당첨 보장 불가. 모든 기법은 통계 기반 참고용입니다.
