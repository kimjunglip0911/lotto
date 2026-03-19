# JL3 전체 튜닝 파이프라인 완료 보고

**실행일**: 2026-03-19  
**플랜**: `top8_고정_미세조정_고도화_b09eaccc.plan.md` (TOP8·28세트 고정)

---

## 1. 수행한 단계

| 단계 | 명령 / 내용 |
|------|-------------|
| Phase 0→3 | `python -m scripts.run_jl3_auto_tune --phase 0` |
| Round2 A | `python -m scripts.run_jl3_auto_tune --phase a` |
| Round2 B | `python -m scripts.run_jl3_auto_tune --phase b` (합격 조합 0건) |
| Round2 C | `python -m scripts.run_jl3_auto_tune --phase c` |
| 최종 반영 | **Phase 3 best**를 채택 (Phase C 대비 정렬 우위) → `jl_service3.py` + `run_jl3_auto_tune.DEFAULTS` |
| 검증 | `python -m scripts.run_jl3_52` 재생성·분석 |
| 단위 테스트 | `python -m pytest tests/test_jl3_tune.py -q` → 3 passed |

**로그 파일** (backend 디렉터리): `jl3_tune_phase0-3.log`, `jl3_tune_phase_a.log`, `jl3_tune_phase_b.log`, `jl3_tune_phase_c.log`

**상태 JSON**: `scripts/jl3_tune_state/` (`phase0_best.json`, `phase1_top3.json`, `results.json`, `phase3_best.json`, `phase_a_top3.json`, `phase_c_best.json`)

---

## 2. Phase 3 vs Phase C (채택 근거)

| 항목 | phase3_best.json | phase_c_best.json |
|------|------------------|-------------------|
| 가중 점수 | **21** | 19 |
| draws_with_ge3 | **15** | 13 |
| 5등 발생 회차 | **15** | 13 |
| 4등 발생 회차 | 2 | 2 |

동일 정렬 키(`_result_sort_key`) 기준 **Phase 3 조합이 우수**하여 프로덕션 상수에 반영함.

---

## 3. 반영된 수치 요약 (`jl_service3.py`)

- `FREQ_BELOW_AVG_SCALE` = **2.3**
- `FREQ_ABOVE_AVG_SCALE` = **0.5**
- `GAP_ABOVE_AVG_BONUS_SCALE` = **1.162**
- `GAP_BELOW_AVG_PENALTY_SCALE` = **0.82**
- `RECENT_N` = **3** (Phase 0와 정합)
- `WINDOW_SIZE` = 390, 코어 나머지·JL 확장 기본은 phase3와 동일

---

## 4. 기법52_JL3 검증 결과 (52회, 재생성 후)

| 지표 | 이전(대략) | **반영 후** |
|------|------------|-------------|
| 당첨 발생 회차 수 | 14 | **15** |
| 4등 발생 회차 | 3 | **2** |
| 5등 발생 회차 | 14 | **15** |
| Top8 ge3 (튜닝 시점) | 14 | **15** |

합격선(52회 전부 당첨)은 여전히 미달. 다만 **당첨 회차 +1**, **이론 상한 ge3 +1**로 플랜 목적(미세조정으로 개선)에 부합.

---

## 5. 플랜에서 이번에 생략한 항목 (선택·고비용)

- `--phase0-wide` 확장 그리드
- 앵커 랜덤 탐색 (§4.4)
- 다구간 52회 교차 검증 (§4.5)
- 실구매 k세트 랭킹 레이어 (§4.6)

필요 시 후속으로 실행 가능.

---

## 6. 한 줄 요약

**Phase 0→3 및 Round2 A→B→C를 끝까지 돌린 뒤, Phase 3 최적을 코드에 반영했고, `기법52_JL3` 기준 당첨 회차는 14→15로 개선되었으며 pytest 3건 통과.**
