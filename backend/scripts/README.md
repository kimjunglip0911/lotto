# backend/scripts — 사용 스크립트 (5개)

**실제로 실행하는 건 2개만 쓰면 됨.**

| 파일 | 용도 | 누가 씀 |
|------|------|--------|
| **run_technique_52.py** | 기법 52회 1세트 생성+분석 (4등 5회 합격 기준) | **직접 실행** — `python -m scripts.run_technique_52 --method <기법명>` |
| **run_fusion_52.py** | 융합 52회 생성+분석+(선택)가중치 튜닝 | **직접 실행** — `python -m scripts.run_fusion_52` / `--tune` |
| generate_fusion_52.py | 융합 52회×20세트 DB 저장 | run_fusion_52, tune_fusion_52_grid가 **내부에서만** 호출 |
| analyze_fusion_52.py | 융합 52회 분석 (5등 이상 회차 수) | run_fusion_52, tune_fusion_52_grid가 **내부에서만** 호출 |
| tune_fusion_52_grid.py | 융합 가중치 그리드 탐색 | run_fusion_52 **--tune** 시 **내부에서만** 호출 |

- **기법 고도화**: `run_technique_52 --method order_statistics` 등 (기법명 10종).
- **융합**: `run_fusion_52` 한 번이면 생성·분석까지, `run_fusion_52 --tune`이면 가중치 튜닝까지.
