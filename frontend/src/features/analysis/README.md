# Analysis Feature (로또 분석 및 생성 시스템)

10가지 통계 및 지능형 알고리즘을 활용하여 1~45번 숫자의 확률 분포를 도출하고, 가장 최적화된 20세트를 생성하여 조합하는 핵심 기능 모듈입니다.

## Architecture

- `components/`:
  - `AnalysisController`: 통합 20세트 저장 생성 + **휠 시뮬레이션 20세트(미저장)** 버튼, 진행 상태 표시
  - `AnalysisResultList`: 생성된 세트를 카드 그리드로 표시. 휠 미리보기 시 상단 배너·제목으로 구분
- `hooks/`: 분석 상태 관리 및 백엔드 생성 데이터 Fetching 훅
- `types/`: 분석 추천 세트 인터페이스(`LotterySet`) 정의

## 주요 로직 및 기법 소개

백엔드 연동:
- **JL Wheel 저장**: `POST /api/analysis/generate-and-save` — `jl_service` 기반 20세트, `method`: `JL Wheel Method`
- **JL Wheel 미저장**: `GET /api/analysis/generate/wheel?count=20&draw_no=` — `jl_service.generate_wheel_sets`

- **1차 통합 10세트 (기법별 단독 추천)**: 아래 10개의 기법들에서 가장 확률 점수가 높게 매겨진 6개 번호 조합 (기법당 1개 세트)
- **2차 최고 최적화 10세트 (통합 결합)**: 여러 기법의 모델들이 공통으로 지목한 1순위 번호 풀에서 충돌을 조정/정리한 후, 확률 점수 총합이 가장 높은 최종 10가지 세트

### 10가지 분석 기법
1. **순서 통계량 분석 (Order Statistics)**: 과거 자리(1~6)별 당첨 번호 기댓값의 분포 확률 매핑
2. **CDM 바이시안 (Compound Dirichlet-Multinomial)**: 빈도와 가중치를 결합한 다항분포 모델 확률.  
   - 적용 파라미터: `CDM_ALPHA=0.15`, 최근 `RECENT_DRAW_N=12`회차에 `RECENT_DRAW_WEIGHT=8.0` 배율 적용 (5등 목표 재조정, GA/PSO 패턴 적용).
3. **마르코프 체인**: 전이 확률 + 최근 빈도 블렌딩 (5등 목표 재조정).
   - 적용 파라미터: `LAPLACE_ALPHA=0.05`, `RECENT_N=10`, `FREQ_BLEND_WEIGHT=0.65`, `FREQ_RECENT_N=12`, `FREQ_RECENT_WEIGHT=6.0`. 1210 회차 마르코프 베스트 3개 일치(5등) 달성.
4. **LSTM 모델**: 순차적 딥러닝 기반 번호별 시계열 로짓 점수화  
   - 적용 파라미터: `WINDOW_SIZE=3`, `MAX_SAMPLES=120`, `HIDDEN_SIZE=128`, `EPOCHS=150`, `LR=0.004`, `RANDOM_SEED=2025`. 1210~1214 검증 시 **1211 회차 Bi-LSTM 베스트 3개 일치(5등)** 달성.
5. **Bi-LSTM 모델**: 양방향 시계열 문맥 파악 딥러닝 점수
6. **CNN 모델**: 2D 그리드(5×9) 패턴 학습 + CDM 점수 블렌딩.  
   - 적용 파라미터: `CNN_WINDOW_SIZE=3`, `CNN_MAX_SAMPLES=120`, `CNN_EPOCHS=160`, `CNN_CDM_BLEND=1.0`. 1210~1214 검증 시 **1210 회차 CNN 베스트 3개 일치(5등)** 달성.
7. **유전 알고리즘 (GA)**: 번호별 가중 빈도 기반 점수. 최근 회차에 가중치를 부여하고 스무딩을 적용.  
   - 적용 파라미터: `RECENT_DRAW_N=12`, `RECENT_DRAW_WEIGHT=8.0`, `GA_SMOOTHING=0.08`. 1210 회차 GA 베스트 3개 일치(5등) 달성, 나머지 회차는 통합 20세트 내 다른 기법이 기여할 수 있음.
8. **입자 군집 최적화 (PSO)**: 번호별 가중 빈도 기반 점수. 최근 회차에 가중치를 부여하고 스무딩을 적용.  
   - 적용 파라미터: `RECENT_DRAW_N=12`, `RECENT_DRAW_WEIGHT=8.0`, `PSO_SMOOTHING=0.08`. 1210 회차 PSO 베스트 3개 일치(5등) 달성, 나머지 회차는 통합 20세트 내 다른 기법이 기여할 수 있음.
9. **행동 경제학 모형**: '도박사의 오류' 역이용 및 '가용성 편향' 보정 등 휴리스틱 가중치 (Softmax 변환)
10. **조합론적 구조 분석 (Lotterycodex)**: 짝홀/고저 패턴 템플릿의 과거 빈도 기반 분배 확률
