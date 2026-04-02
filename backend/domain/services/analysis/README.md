# Analysis Services

## JL 휠 시뮬레이션

> **코드 위치**: `features/analysis/api/jl_service/` (패키지)
>
> 이 디렉토리에는 README만 있습니다. 실제 구현은 features 폴더에 있습니다.

### 모듈 구조

```
features/analysis/api/jl_service/
├── __init__.py        ← 공개 API 재수출
├── config.py          ← 상수·프로파일·오프셋 (튜닝 대상)
├── physics.py         ← 휠 물리 시뮬레이션
├── start_numbers.py   ← 시작번호 전략
├── dedup.py           ← 중복 방지 로직
├── generator.py       ← 세트 생성 엔진
├── analysis.py        ← 당첨 분석
└── search.py          ← 파라미터 역탐색
```

### 핵심 동작

- **시작번호**: 직전 회차(`draw_no-1`) 당첨 본번호 6개 (기본)
- **물리 모델**: `이동거리 = speed² / (2×deceleration)`, 정지번호 `(시작-1+int(거리)) % 45 + 1`
- **정지시간 고정**: `FIXED_STOP_TIME ≈ 43.68`, `deceleration = speed / FIXED_STOP_TIME`
- **중복 방지**: 사전(시작번호 회전 + speed 미조정) + 사후(빈도 기반 번호 치환)
- **등수 판정**: `backend/domain/services/lotto_rank.py`의 `rank_lotto_ticket`

### 튜닝

- `config.py`의 `TWENTY_BASE_OFFSETS`와 `_JITTER_BASE_SPEEDS`를 수정
- `run_wheel_52.py --refine-offset N` 으로 자동 탐색 후 반영 가능

### API

- `GET /api/analysis/generate/wheel` — JL 휠 생성 (미저장)
- `POST /api/analysis/generate-and-save` — JL 휠 20세트 DB 저장
- `GET /api/analysis/draw-duplicate-insight` — 교체 전/후 중복 분석
