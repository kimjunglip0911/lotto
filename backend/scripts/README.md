# backend/scripts — JL3 스크립트

`jl_service3.py` 검증·튜닝·보조 도구입니다. 실행은 **`backend` 디렉터리**에서 `python -m scripts.<모듈>` 형식을 권장합니다.

| 파일 | 용도 | 실행 |
|------|------|------|
| **run_jl3_52.py** | JL3 기법 52회·회차당 28세트 생성·분석·Top8 병목 진단 | `python -m scripts.run_jl3_52` / `--analyze-only` / `--diagnose` / `--draw-start N --draw-end M`(52회 구간) |
| **run_jl3_auto_tune.py** | JL3 자동 튜닝(Phase 0~3, Round2 a/b/c, `draws_with_ge3` 정렬·필터 플래그 DEFAULTS) | `python -m scripts.run_jl3_auto_tune` / `--phase 0\|1\|2\|3\|a\|b\|c` / `--phase0-wide` / **`--phase0-only`**(Phase0만, 확장 그리드와 함께 권장) |
| **run_jl3_sensitivity.py** | JL3 코어 파라미터 ±변동 민감도 | `python -m scripts.run_jl3_sensitivity` / `--perturb 0.1` |
| **run_jl3_anchor_random.py** | §4.4: phase3_best 주변 무작위 N회 메모리 평가(그리드 사각지대 스캔) | `python -m scripts.run_jl3_anchor_random` / `--n 50` / `--rel 0.12` |
| **run_jl3_multi_window.py** | §4.5: 동일 params로 연속 52회 구간 여러 곳 메모리 평가(과적합·분산 점검) | `python -m scripts.run_jl3_multi_window` / `--windows 1060,1111 1112,1163` |
| **run_jl3_combo_rank.py** | §4.6: 28세트 내 k세트 실구매용 2차 랭킹(합·구간·홀짝·연번) | `python -m scripts.run_jl3_combo_rank --draw-no 1215` / `--top-k 5` |

- **JL3 단위 테스트**: `backend`에서 `python -m pytest tests/test_jl3_tune.py -v`
- **합격선(참고)**: 당첨 발생 회차 수 ≥ 52회 등은 `run_jl3_52`·`run_jl3_auto_tune` 문서·코멘트를 따릅니다.

상세 규칙·상수는 [`domain/services/analysis/README.md`](../domain/services/analysis/README.md)를 참고하세요.
