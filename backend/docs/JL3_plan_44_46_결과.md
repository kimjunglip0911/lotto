# JL3 플랜 §4.4 ~ §4.6 및 고비용 옵션 실행 요약

작성 기준: 구현 완료 후 로컬에서 실행한 결과를 반영합니다. (Windows 콘솔 cp949 환경에서는 한글 로그가 깨질 수 있으나 산출물 JSON은 UTF-8입니다.)

## 1. 구현 요약

| 구분 | 내용 |
|------|------|
| **§4.4** | `scripts/run_jl3_anchor_random.py` — `phase3_best.json` 주변 무작위扰동 N회, **DB 저장 없이** `evaluate_jl3_params_on_draws_in_memory` 로 1164~1215 구간 평가. 상위 5개는 `scripts/jl3_tune_state/anchor_random_top5.json` |
| **§4.5** | `scripts/run_jl3_multi_window.py` — 동일 params로 연속 52회 구간을 여러 개 메모리 평가. 기본은 DB 최대 회차 기준 역순 3구간. 결과 `multi_window_eval.json` |
| **§4.6** | `jl_service3.secondary_purchase_score`, `rank_jl3_combos_for_purchase`, CLI `run_jl3_combo_rank.py` — TOP8·28세트 구조 불변, k세트만 고를 때 2차 휴리스틱(합·홀짝·구간·연번). **당첨과 무관한 참고용** |
| **공통** | `run_jl3_52.py`에 `evaluate_jl3_params_on_draws_in_memory`, `weighted_score_from_draws_per_tier`, `--draw-start`/`--draw-end`(정확히 52회) 추가 |
| **고비용 Phase0** | `run_jl3_auto_tune`에 **`--phase0-only`** 추가. Phase0 확장 그리드만 돌릴 때는 반드시 `--phase 0 --phase0-wide --phase0-only` 사용. **`--phase 0`만 지정하면 기존과 같이 Phase 0→1→2→3 전체가 이어서 실행됨** (의도치 않은 장시간 실행 방지용). |

## 2. §4.5 다구간 메모리 평가 결과 (동일 phase3 params)

| 구간 | 가중점수 | 당첨 발생 회차 수 | ge3 | ge4 | 비고 |
|------|----------|-------------------|-----|-----|------|
| 1164~1215 | 21 | 15 | 15 | 2 | 기존 검증 구간 |
| 1112~1163 | 7 | 4 | 4 | 1 | |
| 1060~1111 | 6 | 3 | 3 | 1 | |

- 가중점수 **max−min = 15**, 당첨 회차 수 **max−min = 12** 로 구간에 따라 지표가 크게 달라짐.
- **해석(참고)**: 검증에 쓴 최근 52회는 상대적으로 유리한 구간일 수 있으며, 과거 구간에서는 동일 알고리즘 성능이 낮게 나올 수 있음.

## 3. §4.4 앵커 랜덤 프로브 (예: `--n 20 --seed 7`)

- **기준(앵커)**: 가중점수 **21**, 당첨 회차 **15**, ge3=15, ge4=2.
- **무작위 20회 중 최고**: 가중점수 **18** (그 외 지표도 기준보다 낮은 편).
- **결론**: 해당 시드·횟수에서는 **그리드/미세조정 앵커가 무작위扰동 대비 우수** — 사각지대를 소폭 스캔한 수준에서는 개선 후보가 나오지 않음.

## 4. §4.6 실구매 2차 랭킹 (예: 회차 1215, 상위 5)

- `python -m scripts.run_jl3_combo_rank --draw-no 1215 --top-k 5`
- 필터 적용 후 28세트 전체가 생성되며, 2차 점수는 **패턴 선호용**이며 당첨 확률을 올리지 않음.

## 5. 고비용: Phase0 확장 그리드

- 명령:  
  `python -m scripts.run_jl3_auto_tune --phase 0 --phase0-wide --phase0-only`
- **5×5 = 25회** 전량이 각각 52회×DB 생성·분석을 수행하므로 **수십 분 이상** 걸릴 수 있음.
- 완료 시 `phase0_best.json`이 갱신되며, 이후 Phase 1~3을 별도 실행할지 결정하면 됨.

## 6. 부록: 콘솔 인코딩

- `run_jl3_multi_window.py` 출력에서 유니코드 대시(`—`)는 cp949에서 `UnicodeEncodeError`를 유발할 수 있어 **일반 쉼표 문장**으로 수정함.
