# backend/scripts

실행은 **`backend` 디렉터리**에서 `python -m scripts.<모듈>` 형식을 권장합니다.

| 파일 | 용도 | 실행 |
|------|------|------|
| **run_wheel_52.py** | DB **최신 52회차**·평가 상한 `up_to` 기준 **1~up_to 누적 TOP6 고정 시작**·20 speed·평가 시 `dedup_across_sets=True`(실제 생성과 동일한 중복 방지). 세트 품질은 **가중치 점수(상위 등수 절대 우선)**로 판정. `--tune-reconcile`: **5등 1회만**(기본) 또는 레거시 5등 2회만(`--tune-double-fifth`) 세트 1차 조정 후, **악화 세트는 기준 복구 + 반대방향 2차 재튜닝**(`--tune-alt-delta`, 미지정 시 `--tune-delta` 동일). `--refine-set N`: 세트# N만 그리드 탐색(옵션 `--refine-min-speed/--refine-max-speed` 범위 제한 가능). `--refine-all`: 세트#1~20 순차 탐색(권장 `--refine-step 0.25~0.5`). `당첨 이력.md`는 명목 speed로 표 기록 | `python -m scripts.run_wheel_52 --seed 42 --tune-reconcile --tune-delta 0.15 --tune-alt-delta 0.1 --write-history docs/당첨 이력.md` |

상세 규칙은 [`domain/services/analysis/README.md`](../domain/services/analysis/README.md)를 참고하세요.

검증 테스트:
- `pytest tests/test_run_wheel_52_tuning.py`
- `pytest tests/test_jl_service_dedup.py`
