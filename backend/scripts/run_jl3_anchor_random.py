# -*- coding: utf-8 -*-
"""
§4.4: phase3_best(또는 지정 JSON) 주변 하이퍼박스에서 무작위 샘플 N회 메모리 평가.

DB drawings 없이 `evaluate_jl3_params_on_draws_in_memory`로 그리드 사각지대를 빠르게 스캔.

사용 (backend 디렉터리):
  python -m scripts.run_jl3_anchor_random
  python -m scripts.run_jl3_anchor_random --n 80 --rel 0.15 --seed 42
  python -m scripts.run_jl3_anchor_random --params scripts/jl3_tune_state/phase3_best.json
"""
from __future__ import annotations

import argparse
import copy
import json
import random
import sys
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True
_backend_root = Path(__file__).resolve().parent.parent
_scripts_root = _backend_root / "scripts"
for p in (_scripts_root, _backend_root):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from run_jl3_52 import DRAW_NOS, evaluate_jl3_params_on_draws_in_memory  # noqa: E402

DEFAULT_PARAMS_JSON = _scripts_root / "jl3_tune_state" / "phase3_best.json"

_FLOAT_PERTURB_KEYS = (
    "freq_below_avg_scale",
    "freq_above_avg_scale",
    "streak_near_max_penalty",
    "gap_above_avg_bonus_scale",
    "gap_below_avg_penalty_scale",
    "neighbor_weight",
    "neighbor_bonus_per_hit",
    "zone_weight",
    "trend_weight",
    "last_draw_bonus",
    "gap_threshold_ratio",
    "gap_exp_scale",
    "gap_linear_below",
    "sum_margin_ratio",
    "odd_even_min_ratio",
)


def _load_params(path: Path) -> dict[str, Any]:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if "params" in data:
        return dict(data["params"])
    return dict(data)


def _perturb(base: dict[str, Any], rng: random.Random, rel: float) -> dict[str, Any]:
    p = copy.deepcopy(base)
    for k in _FLOAT_PERTURB_KEYS:
        if k not in p:
            continue
        v = p[k]
        if isinstance(v, bool):
            continue
        if isinstance(v, (int, float)):
            mult = 1.0 + rng.uniform(-rel, rel)
            nv = float(v) * mult
            if k == "gap_threshold_ratio":
                p[k] = max(0.5, min(0.98, nv))
            elif k in ("odd_even_min_ratio", "sum_margin_ratio"):
                p[k] = max(0.0, min(0.5, nv))
            else:
                p[k] = max(0.01, round(nv, 6))

    if "window_size" in p:
        w0 = int(p["window_size"])
        p["window_size"] = int(max(80, min(600, round(w0 * (1.0 + rng.uniform(-rel, rel))))))
    if "recent_n" in p:
        r0 = int(p["recent_n"])
        p["recent_n"] = int(max(2, min(18, r0 + rng.choice([-2, -1, 0, 1, 2]))))

    if rng.random() < 0.12 and "apply_sum_filter" in p:
        p["apply_sum_filter"] = not bool(p["apply_sum_filter"])
    if rng.random() < 0.12 and "apply_odd_even_filter" in p:
        p["apply_odd_even_filter"] = not bool(p["apply_odd_even_filter"])
    if rng.random() < 0.08 and "use_gap_exponential" in p:
        p["use_gap_exponential"] = not bool(p["use_gap_exponential"])
    return p


def _sort_key(ev: dict[str, Any]) -> tuple:
    d = ev["draws_per_tier"]
    return (
        -int(ev["weighted_score"]),
        -int(ev["num_hit_draws"]),
        -int(ev["draws_with_ge4"]),
        -int(ev["draws_with_ge3"]),
    )


def main() -> None:
    ap = argparse.ArgumentParser(description="JL3 앵커 주변 무작위 파라미터 프로브 (메모리 평가)")
    ap.add_argument("--params", type=Path, default=DEFAULT_PARAMS_JSON, help="기준 파라미터 JSON")
    ap.add_argument("--n", type=int, default=50, help="무작위 시도 횟수")
    ap.add_argument("--rel", type=float, default=0.12, help="실수 파라미터 상대 변동폭 (±)")
    ap.add_argument("--seed", type=int, default=None, help="난수 시드")
    args = ap.parse_args()

    if not args.params.is_file():
        print(f"파일 없음: {args.params}", file=sys.stderr)
        sys.exit(2)

    base = _load_params(args.params)
    rng = random.Random(args.seed)

    print("[§4.4] 앵커(기준) 평가 중...")
    baseline = evaluate_jl3_params_on_draws_in_memory(DRAW_NOS, base)
    print(
        f"  기준: score={baseline['weighted_score']} hit={baseline['num_hit_draws']}/52 "
        f"ge3={baseline['draws_with_ge3']} ge4={baseline['draws_with_ge4']} tier={baseline['draws_per_tier']}",
    )

    trials: list[tuple[dict[str, Any], dict[str, Any]]] = []
    for i in range(args.n):
        cand = _perturb(base, rng, args.rel)
        ev = evaluate_jl3_params_on_draws_in_memory(DRAW_NOS, cand)
        trials.append((ev, cand))
        if (i + 1) % 10 == 0:
            print(f"  ... {i + 1}/{args.n}")

    trials.sort(key=lambda x: _sort_key(x[0]))
    top = trials[:5]

    print("\n상위 5개 (무작위 샘플 중, 메모리 평가 기준):")
    for rank, (ev, cand) in enumerate(top, 1):
        print(
            f"  #{rank} score={ev['weighted_score']} hit={ev['num_hit_draws']} "
            f"ge3={ev['draws_with_ge3']} ge4={ev['draws_with_ge4']} tier={ev['draws_per_tier']}",
        )

    best_ev, best_cand = trials[0]
    bkey = _sort_key(baseline)
    tkey = _sort_key(best_ev)
    if tkey < bkey:
        print("\n→ 무작위 샘플 중 기준(앵커)보다 우수한 조합이 있음 (위 #1 참고).")
    else:
        print("\n→ 이번 시드/횟수에서는 앵커가 최선 또는 동급 (그리드·미세조정이 이미 해당 구간을 잘 커버했을 수 있음).")

    out_path = _scripts_root / "jl3_tune_state" / "anchor_random_top5.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "baseline": {k: baseline[k] for k in baseline if k != "draw_nos_range"},
        "baseline_draws_per_tier": baseline["draws_per_tier"],
        "top5": [
            {
                "rank": i + 1,
                "eval": {k: ev[k] for k in ev if k != "draw_nos_range"},
                "params": cand,
            }
            for i, (ev, cand) in enumerate(top)
        ],
        "n_samples": args.n,
        "rel": args.rel,
        "seed": args.seed,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"\n요약 저장: {out_path}")


if __name__ == "__main__":
    main()
