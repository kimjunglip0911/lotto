# backend/scripts

`run_wheel_52.py`는 이제 `features/analysis/scripts/run_wheel_52.py`로 이동했습니다.

- 이 폴더의 `run_wheel_52.py`는 **호환용 래퍼**입니다.
- 실제 52회 테스트 이력 파일은 `features/analysis/scripts/당첨 이력.md`를 사용합니다.

권장 실행:
- 프로젝트 루트에서 `python -m features.analysis.scripts.run_wheel_52`

검증 테스트:
- `pytest tests/test_run_wheel_52_tuning.py`
- `pytest tests/test_jl_service_dedup.py`
