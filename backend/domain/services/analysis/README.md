# Analysis Services

로또 번호 추천을 위한 다양한 분석 기법 서비스 모음입니다.

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

## 기타 분석 기법
- `ga_service.py` - 유전 알고리즘
- `pso_service.py` - 입자 군집 최적화
- `unified_generator_service.py` - 10개 기법 통합 20세트 생성
