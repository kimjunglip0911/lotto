# Analysis Services

로또 번호 추천을 위한 다양한 분석 기법 서비스 모음입니다.

## 순서 통계량 (order_statistics_service.py)

포지션별(1~6번째) 당첨 번호 평균에 대한 가우시안 점수(Max Pooling)와 최근 회차 가중치를 적용해 번호별 추천 점수를 산출합니다. 52회 5등 50% 목표 튜닝용 상수를 지원합니다.

> **참고**: 로또는 난수 추첨이므로 당첨 보장 불가. 통계 기반 참고용입니다.

### 조정 가능 수치

`order_statistics_service.py` 상단 상수 블록에서 튜닝 가능합니다. (1215회 포함 최신 52회, 5등 26회 이상 목표)

| 상수 | 설명 | 기본값 |
|------|------|--------|
| SIGMA | 가우시안 분산 (기댓값 근처 점수 폭). 3~5 권장 | 4.0 |
| RECENT_DRAWS | 최근 트렌드 반영 회차 수 | 5 |
| RECENT_WEIGHT | 최근 회차 가중치 배율. 1.5~2.5 권장 | 2.0 |
| AVG_USE_LAST_N_DRAWS | 포지션 평균 계산 시 사용 회차 수. 0=전체, 양수=최근 N회만 | 0 |
| THEORETICAL_BLEND | 이론적 기댓값 블렌딩 비율 (0=실제만, 1=이론만). 6/45 E[X_k]=k·46/7 반영 | 0.25 |
| RECENT_DECAY | 최근 회차 시간감쇠 (가장 최근=1.0, 이전 회차=RECENT_DECAY^n). 0이면 동일 가중 | 0.85 |

### 분석·재생성 스크립트 (52회)

- **52회 순서 통계량 전용 생성(권장)**: 회차당 1세트만 생성해 20세트 대비 빠르게 튜닝 반복  
  `python -m scripts.generate_order_statistics_only_52`
- **52회 통합 20세트 생성**: 10개 기법+통합 조합 전체가 필요할 때  
  `python -m scripts.generate_drawings_52`
- **52회 순서 통계량 전용 분석**: 순서 통계량 베스트 1세트 기준 5등 달성 회차 수, 26회 이상 여부  
  `python -m scripts.analyze_order_statistics_52`

목표 미달 시 상수 조정 후 `generate_order_statistics_only_52` → `analyze_order_statistics_52` 순으로 재실행하고, 필요 시 다른 기법과의 연계를 검토합니다.

### 52회 튜닝 결과 (1164~1215, 순서 통계량 베스트 1세트 기준)

| SIGMA | RECENT_DRAWS | RECENT_WEIGHT | AVG_USE_LAST_N_DRAWS | 5등 달성 회차 수 |
|-------|--------------|---------------|----------------------|------------------|
| 3.0   | 5            | 2.0           | 0                    | 2                |
| 4.0   | 5            | 2.0           | 0                    | 2                |
| 5.0   | 8            | 2.0           | 0                    | 0                |
| 4.0   | 6            | 2.2           | 52                   | **3** (최다)     |
| 4.0   | 6            | 2.3           | 52                   | 3                |
| 3.5   | 8            | 2.5           | 52                   | 1                |
| 4.0   | 10           | 2.0           | 80                   | 2                |
| 4.0   | 6            | 2.2           | 36                   | 2                |

목표 26회(50%)에는 미달. 순서 통계량 단일 기법만으로는 상한에 가깝게 나온 것으로 보이며, 다른 기법과의 연계(통합 최적 조합 비중 등) 검토가 필요합니다.

### 외부 검색에 따른 보완 반영

- **이론적 기댓값 블렌딩**: 6/45 로또의 k번째 순서통계량 기댓값 E[X_k] = k·46/7 (SCIRP, Keith Briggs 등). 실제 포지션 평균에 이론값을 THEORETICAL_BLEND 비율로 섞어 노이즈 완화.
- **최근 회차 시간감쇠**: 최근 당첨번호일수록 높은 가중치 부여(시간감쇠). RECENT_DECAY^draw_index 로 회차별 가중치 차등 적용.
- **포지션별 핫존**(참고): 일부 자료에서 포지션 1은 1~3, 포지션 6은 32~45 구간 출현 경향 제시. 현재는 포지션 평균+이론 블렌딩으로 간접 반영.

위 보완 적용 후에도 52회 5등 3회 수준 유지. 단일 기법 상한에 근접한 것으로 보임.

### 그리드 탐색 결과 (810조합, 2025 적용)

`python -m scripts.tune_order_statistics_52_grid` 실행 시 5등 **5회**로 최다인 조합이 선택·적용됨.

| 상수 | 적용값 |
|------|--------|
| SIGMA | 5.0 |
| RECENT_DRAWS | 6 |
| RECENT_WEIGHT | 2.4 |
| AVG_USE_LAST_N_DRAWS | 52 |
| THEORETICAL_BLEND | 0.0 |
| RECENT_DECAY | 0.85 |

(목표 26회에는 미달. 순서 통계량 단일 기법으로는 5회가 현재 최고.)

## 출현 빈도 및 추세 기법 (frequency_trend_service.py)

출현 빈도, 갭 오버듀, 다음 출현 확률, 최근 50회 추세 4가지 지표를 가중 합산하여 번호별 점수를 산출합니다. Hot/Cold·갭 분석 기반.

> **참고**: 로또는 난수 추첨이므로 당첨 보장 불가. 통계 기반 참고용입니다.

### 조정 가능 수치

`frequency_trend_service.py` 상단 상수 블록에서 튜닝 가능합니다. (최근 5회차 5등 이상 목표 기준, v2 튜닝 적용)

| 상수 | 설명 | 기본값 |
|------|------|--------|
| MAX_HISTORY_DRAWS | 최대 조회 회차 수 | 100 |
| RECENT_FREQ_N | 출현 빈도·추세용 최근 N회차 | 36 |
| RECENT_FREQ_WEIGHT_FACTOR | 최신 회차 가중치 배율 | 2.0 |
| TREND_WINDOWS | 추세 구간 수 | 5 |
| WEIGHT_FREQ | 출현 빈도 가중치 | 0.22 |
| WEIGHT_NEXT_PROB | 다음 출현 확률 가중치 | 0.30 |
| WEIGHT_GAP_OVERDUE | 갭 오버듀 가중치 | 0.32 |
| WEIGHT_TREND | 추세 가중치 | 0.16 |

### 분석 스크립트

- **분석**: 1210~1214 회차 출현 빈도·추세 기법 추천 vs 당첨번호 매칭, 전체 20세트 5등 달성 여부  
  `python -m scripts.analyze_frequency_trend_draws_1210_1214`

## 행동 경제학 분석 (behavioral_service.py)

대중 선호 번호(생일, 뜨거운 손)를 기피하고, 대중 기피 번호(직전 회차, 32번 이상)를 선호하여 기대 수익률을 극대화하는 기법입니다.

### 조정 가능 수치

`behavioral_service.py` 상단 상수 블록에서 튜닝 가능합니다. (1210~1214 회차 5등 이상 목표 기준)

| 상수 | 설명 | 기본값 |
|------|------|--------|
| SCORE_LOW_RANGE_PENALTY | 1~31번 페널티 (대중 선호 구간) | -0.2 |
| SCORE_HIGH_RANGE_BONUS | 32~45번 보너스 (대중 기피 구간) | 1.0 |
| SCORE_LAST_DRAW_BONUS | 직전 회차 번호 보너스 | 1.2 |
| SCORE_HOT_HAND_PENALTY | 최근 빈출 번호 (0 이상이면 선호) | 0.3 |
| HOT_HAND_MIN_FREQ | 뜨거운 손 기준 출현 횟수 | 3 |
| RECENT_DRAWS_FOR_HOT | 뜨거운 손 분석용 최근 N회차 | 5 |

### 분석·재생성 스크립트

- **분석**: 1210~1214 회차 행동 경제학 추천 vs 당첨번호 매칭  
  `python -m scripts.analyze_behavioral_draws_1210_1214`
- **재생성**: 1210~1214 회차 추천 20세트 전체 재생성 (통합 기법 포함)  
  `python -m scripts.refresh_cdm_drawings_1210_1214`

## CDM 바이시안 (cdm/cdm_service.py)

Compound-Dirichlet-Multinomial 기법. 과거 당첨 빈도에 Dirichlet prior를 더한 가중치로 번호 추천.

### 조정 가능 수치 (1210~1214 회차 5등 목표)

| 상수 | 설명 | 기본값 |
|------|------|--------|
| CDM_ALPHA | Dirichlet prior (낮을수록 고빈도 집중) | 0.15 |
| RECENT_DRAW_N | 최근 N회차 가중치 부여 | 12 |
| RECENT_DRAW_WEIGHT | 최근 회차 가중치 배율 | 8.0 |

### 분석·재생성

- **분석**: `python -m scripts.analyze_cdm_draws_1210_1214`
- **재생성**: `python -m scripts.refresh_cdm_drawings_1210_1214`

## 마르코프 체인 (markov_service.py)

전이 확률 행렬 + 최근 빈도 블렌딩. 직전 회차 전이 패턴과 최근 출현 빈도를 결합.

### 조정 가능 수치 (1210~1214 회차 5등 목표)

| 상수 | 설명 | 기본값 |
|------|------|--------|
| LAPLACE_ALPHA | 전이 행렬 Laplace 스무딩 | 0.05 |
| RECENT_N | 직전 N회차 가중 블렌딩 | 10 |
| RECENT_WEIGHTS | 최신 회차 가중치 | (0.02, 0.03, ... 0.18) |
| FREQ_BLEND_WEIGHT | 빈도 블렌딩 비율 (0~1) | 0.65 |
| FREQ_RECENT_N | 빈도 계산용 최근 회차 수 | 12 |
| FREQ_RECENT_WEIGHT | 최근 6회차 빈도 배율 | 6.0 |

### 분석·재생성

- **분석**: `python -m scripts.analyze_markov_draws_1210_1214`

## 융합 기법 (fusion_service.py)

10개 기법의 점수를 **가중 합산**하여 하나의 점수 벡터로 만든 뒤, 회차당 **20세트**를 생성합니다. 기존 10개 서비스의 상수는 변경하지 않고, 융합 전용 가중치(WEIGHTS)만 조정합니다.

- **목표**: 최근 52회(1164~1215) 중 **26회 이상**에서 20세트 중 **1세트라도 5등 이상**.
- **생성**: `python -m scripts.generate_fusion_52` (52회 × 20세트, method=`융합(52회)`).
- **분석**: `python -m scripts.analyze_fusion_52` (회차별 20세트 중 5등 1세트 이상 여부 집계).
- **가중치 튜닝(고도화)**: `python -m scripts.tune_fusion_52_grid`  
  - **1단계**: 코스 그리드 — 12개 프로파일(균등, 순서통계+빈도, 출현빈도_우세, 순서통계_단독강화, 융합_가중치최적화, 빈도_강화, 순서통계_케이스, CDM+마르코프, 행동+빈도, GA+PSO+순서, 순서+빈도_밸런스, 순서_극대화) 평가.  
  - **2단계**: 파인 그리드 — 1단계 최고 조합 주변으로 순서통계(w0)·빈도(w9) 가중치만 ±0.02 간격으로 탐색, 합=1 유지.  
  - 최종 최고 조합을 fusion_service.WEIGHTS에 저장. 목표 26회 미달 시 스크립트 재실행 시 저장된 조합 기준으로 다시 파인 그리드 탐색.
- **목표 미달 시 반복**: `python -m scripts.run_fusion_52_until_target` (추가 프로파일로 재생성·재분석 후 최고값 반영).

## 기타 분석 기법
- `ga_service.py` - 유전 알고리즘
- `pso_service.py` - 입자 군집 최적화
- `unified_generator_service.py` - 10개 기법 통합 20세트 생성. 통합 최적 조합 10세트는 점수 상위 후보 중에서 겹침을 최소화하는 Greedy 다양화 선택을 사용함.
