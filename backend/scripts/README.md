# backend/scripts

JL 휠·분석 스크립트는 **`features/analysis/scripts/`** 에 있습니다.

## 권장 실행 (프로젝트 루트)

### 1등 offset 선정 → 3년치 단일 세트 이력

```powershell
python -m features.analysis.scripts.run_01_pick_offset_start --prev-draw 1217 --current-draw 1218 --set-index 1 --write-pick pick.json
python -m features.analysis.scripts.run_02_three_year_single_set --pick-json pick.json --write-history "features/analysis/scripts/당첨 이력.md"
```

- 단계별 설명: `.agents/workflows/01.1등당첨.md`
- 배치 평가 모듈: `features/analysis.scripts.jl_wheel_batch_eval`

## 검증 테스트

- `pytest backend/tests/test_lotto_rank.py`
