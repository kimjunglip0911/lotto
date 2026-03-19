# -*- coding: utf-8 -*-
"""
JL3 파라미터 민감도 분석: DEFAULTS 기준 각 파라미터 ±20% 변경 시 당첨 회차 수·가중 점수 변화 출력.

사용: backend 디렉터리에서
  python -m scripts.run_jl3_sensitivity
  python -m scripts.run_jl3_sensitivity --perturb 0.1   # ±10%

영향이 큰 파라미터를 Phase 1/2에서 더 촘촘히 탐색하는 데 참고.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.dont_write_bytecode = True
_backend_root = Path(__file__).resolve().parent.parent
_scripts_root = _backend_root / "scripts"
for p in (_scripts_root, _backend_root):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from run_jl3_auto_tune import DEFAULTS, _evaluate_params, CORE_PARAM_KEYS


def main() -> None:
    parser = argparse.ArgumentParser(description="JL3 파라미터 민감도 분석 (±perturb)")
    parser.add_argument("--perturb", type=float, default=0.20, help="변동 비율 (기본 0.20=±20%%)")
    args = parser.parse_args()
    perturb = args.perturb

    # 실수·정수 파라미터만 분석 (use_gap_exponential 제외)
    keys = [k for k in CORE_PARAM_KEYS if k in DEFAULTS]
    # 구조/확장 파라미터도 포함하려면: keys = [k for k in DEFAULTS if k != "use_gap_exponential" and isinstance(DEFAULTS.get(k), (int, float))]
    print(f"[민감도 분석] DEFAULTS 기준 각 파라미터 ±{int(perturb*100)}% 변경 시 52회 당첨 회차 수·가중 점수")
    print("=" * 80)

    baseline_passed, baseline_draws, baseline_hit, baseline_score, _ge3b, _ge4b = _evaluate_params(
        dict(DEFAULTS), verbose=False
    )
    print(f"기준선 (DEFAULTS): 당첨회차={baseline_hit}, 가중점수={baseline_score}")
    print("-" * 80)

    for param_name in keys:
        base = DEFAULTS[param_name]
        if not isinstance(base, (int, float)):
            continue
        results = []
        for delta in (-perturb, 0.0, perturb):
            if delta == 0:
                val = base
            else:
                val = base * (1.0 + delta) if base != 0 else (0.01 if delta > 0 else 0.01)
            if isinstance(base, float):
                val = round(val, 3)
            else:
                val = max(1, int(round(val)))
            params = dict(DEFAULTS)
            params[param_name] = val
            _, _, num_hit, score, _ge3, _ge4 = _evaluate_params(params, verbose=False)
            results.append((val, num_hit, score))
        low_val, low_hit, low_score = results[0]
        mid_val, mid_hit, mid_score = results[1]
        high_val, high_hit, high_score = results[2]
        hit_range = max(low_hit, mid_hit, high_hit) - min(low_hit, mid_hit, high_hit)
        score_range = max(low_score, mid_score, high_score) - min(low_score, mid_score, high_score)
        print(f"{param_name}:")
        print(f"  {-perturb*100:+.0f}% = {low_val}  -> 당첨회차={low_hit}, 점수={low_score}")
        print(f"   기준 = {mid_val}  -> 당첨회차={mid_hit}, 점수={mid_score}")
        print(f"  {+perturb*100:+.0f}% = {high_val}  -> 당첨회차={high_hit}, 점수={high_score}")
        print(f"  -> 당첨회차 변동폭={hit_range}, 점수 변동폭={score_range}")
        print()
    print("=" * 80)
    print("변동폭이 큰 파라미터를 Phase 1/2 그리드에서 더 촘촘히 탐색하는 것을 권장합니다.")


if __name__ == "__main__":
    main()
