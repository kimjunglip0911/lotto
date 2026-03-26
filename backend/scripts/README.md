# backend/scripts

`run_wheel_52.py`는 이제 `features/analysis/scripts/run_wheel_52.py`로 이동했습니다.

- 이 폴더의 `run_wheel_52.py`는 **호환용 래퍼**입니다.
- 실제 52회 테스트 이력 파일은 `features/analysis/scripts/당첨 이력.md`를 사용합니다.

권장 실행:
- 프로젝트 루트에서 `python -m features.analysis.scripts.run_wheel_52`
- 시작번호 전략 지정: `python -m features.analysis.scripts.run_wheel_52 --start-strategy blended`

검증 테스트:
- `pytest tests/test_run_wheel_52_tuning.py`
- `pytest tests/test_jl_service_dedup.py`

튜닝 정책 메모:
- `--tune-reconcile` 기본 대상은 **미당첨(0건) 세트**입니다.
- 레거시 비교가 필요하면 `--tune-double-fifth`를 사용합니다.
- `--tune-unhit`는 기본값 정책을 명시적으로 지정할 때 사용합니다.
- `--tune-reconcile` 실행 시 **우선순위 게이트(1~4등, 1~3등 비악화)**를 통과하지 못하면 자동으로 baseline 결과로 롤백합니다.

시작번호 전략 메모:
- `blended` (기본): 직전 회차 + 최근 핫번호 + 과숙번호 가중 블렌딩
- `previous_draw`: 각 회차 직전 당첨 본번호 6개
- `global_top6_fixed`: 평가 구간 상한까지 누적 빈도 TOP6 고정
