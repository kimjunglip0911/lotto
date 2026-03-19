# -*- coding: utf-8 -*-
"""
JL3 기법 자동 튜닝: 4단계 계층적 탐색 + Round2 JL 확장 탐색.

- Phase 0: 구조 파라미터(window_size, recent_n) 그리드 탐색
- Phase 1: 기존 5개 파라미터 독립 스윕 → 상위 3개 후보
- Phase 2: 3^5 그리드 탐색, 재시작 지원
- Phase 3: 상위 5개 주변 ±10% 미세 조정

Round2 (합격선 근접용):
- Phase A: JL 확장 팩터(이웃/구간/트렌드/직전회차/갭지수) 독립 스윕 → phase_a_top3.json
- Phase B: Phase A best_jl + Phase 1 Top3 기반 3^5 그리드 → results.json
- Phase C: Phase B 상위 5개 주변 ±15% 미세 조정 → phase_c_best.json

사용: backend 디렉터리에서
  python -m scripts.run_jl3_auto_tune              # Phase 0→1→2→3 전체
  python -m scripts.run_jl3_auto_tune --phase 0 --phase0-wide --phase0-only  # Phase0 확장 그리드만
  python -m scripts.run_jl3_auto_tune --phase a   # Round2: JL 확장 스윕
  python -m scripts.run_jl3_auto_tune --phase 1   # Phase 1 (좁은 그리드)
  python -m scripts.run_jl3_auto_tune --phase b   # Round2: 확장+코어 그리드
  python -m scripts.run_jl3_auto_tune --phase c   # Round2: 미세 조정
  python -m scripts.run_jl3_auto_tune --phase 2 --resume
  python -m scripts.run_jl3_auto_tune --stop-on-pass

평가 정렬(_result_sort_key): 등수 목표 충족 개수 → 가중 점수 → 당첨 회차 수 → Top8 적중 3+ 회차 수(draws_with_ge3) → 4+(draws_with_ge4) → 목표 거리.
목표(작업지시.md): 52회차 기준 1등1, 2등1, 3등12, 4등24, 5등52. TOP_N=8(28세트) 고정. 동적 합계/홀짝 필터는 DEFAULTS의 apply_* 로 튜닝.
"""
from __future__ import annotations

import argparse
import itertools
import json
import sys
import time
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True
_backend_root = Path(__file__).resolve().parent.parent
_scripts_root = _backend_root / "scripts"
for p in (_scripts_root, _backend_root):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from run_jl3_52 import (
    DRAW_NOS,
    TOTAL_DRAWS,
    analyze_52_by_tier,
    compute_top8_coverage_metrics,
    generate_52_twenty_eight_sets,
)

TUNE_METHOD_NAME = "jl3_auto_tune"
STATE_DIR = Path(__file__).resolve().parent / "jl3_tune_state"
RESULTS_JSON = STATE_DIR / "results.json"
PHASE0_BEST_JSON = STATE_DIR / "phase0_best.json"
PHASE1_TOP3_JSON = STATE_DIR / "phase1_top3.json"
PHASE2_PROGRESS_JSON = STATE_DIR / "phase2_progress.json"
PHASE_A_TOP3_JSON = STATE_DIR / "phase_a_top3.json"
PHASE_C_BEST_JSON = STATE_DIR / "phase_c_best.json"

# 기본값 (jl_service3 상수 및 phase3_best.json 동기화 — Phase 0→3 전체 후 선정, Round2 Phase C보다 우수)
DEFAULTS: dict[str, Any] = {
    "freq_below_avg_scale": 2.3,
    "freq_above_avg_scale": 0.5,
    "streak_near_max_penalty": 0.45,
    "gap_above_avg_bonus_scale": 1.162,
    "gap_below_avg_penalty_scale": 0.82,
    "window_size": 390,
    "recent_n": 3,
    "neighbor_weight": 0.0,
    "neighbor_bonus_per_hit": 0.05,
    "zone_weight": 0.0,
    "trend_weight": 0.0,
    "last_draw_bonus": 1.0,
    "use_gap_exponential": False,
    "gap_threshold_ratio": 0.80,
    "gap_exp_scale": 3.0,
    "gap_linear_below": 0.35,
    "sum_margin_ratio": 0.0,
    "odd_even_min_ratio": 0.01,
    "apply_sum_filter": True,
    "apply_odd_even_filter": True,
}

# Phase 0 구조 파라미터 그리드 (window_size x recent_n)
PHASE0_GRID: dict[str, list[Any]] = {
    "window_size": [130, 180, 260, 390],
    "recent_n": [3, 6, 9, 12],
}

# Phase 0 확장 그리드 (다양한 각도 탐색용, --phase0-wide 시 사용)
PHASE0_GRID_WIDE: dict[str, list[Any]] = {
    "window_size": [100, 180, 260, 390, 520],
    "recent_n": [2, 4, 6, 9, 12],
}

# Phase A: JL 확장 팩터 + 동적 필터/갭지수 독립 스윕용 그리드
PHASE_A_GRID: dict[str, list[Any]] = {
    "neighbor_weight": [0.0, 0.1, 0.2, 0.3, 0.6, 1.0, 1.5],
    "neighbor_bonus_per_hit": [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40],
    "zone_weight": [0.0, 0.1, 0.2, 0.3, 0.6, 1.0, 1.5],
    "trend_weight": [0.0, 0.1, 0.2, 0.3, 0.6, 1.0, 1.5],
    "last_draw_bonus": [1.0, 1.03, 1.06, 1.1, 1.15, 1.2, 1.25],
    "use_gap_exponential": [False, True],
    "sum_margin_ratio": [0.0, 0.05, 0.10],
    "odd_even_min_ratio": [0.005, 0.01, 0.02],
    "gap_threshold_ratio": [0.70, 0.80, 0.90],
    "gap_exp_scale": [2.0, 3.0, 4.0],
    "gap_linear_below": [0.30, 0.35, 0.40],
}

# Phase 1 / Phase B: 기존 5개 파라미터 (현재 최적값 주변 촘촘한 그리드)
PHASE1_GRID: dict[str, list[Any]] = {
    "freq_below_avg_scale": [1.5, 1.7, 1.9, 2.1, 2.3],
    "freq_above_avg_scale": [0.32, 0.36, 0.4, 0.44, 0.5],
    "streak_near_max_penalty": [0.4, 0.45, 0.5, 0.55, 0.6],
    "gap_above_avg_bonus_scale": [1.25, 1.32, 1.4, 1.48, 1.55],
    "gap_below_avg_penalty_scale": [0.82, 0.86, 0.9, 0.94, 0.98],
}

# Phase 1 Coarse: 넓은 범위 탐색 (--phase1-coarse 시 사용)
PHASE1_GRID_COARSE: dict[str, list[Any]] = {
    "freq_below_avg_scale": [1.2, 1.5, 1.9, 2.3],
    "freq_above_avg_scale": [0.28, 0.36, 0.44, 0.52],
    "streak_near_max_penalty": [0.35, 0.45, 0.55, 0.65],
    "gap_above_avg_bonus_scale": [1.15, 1.35, 1.55, 1.75],
    "gap_below_avg_penalty_scale": [0.78, 0.86, 0.94, 1.0],
}

PARAM_KEYS = list(DEFAULTS.keys())
# Phase 3 미세 조정 대상 (실수 5개만)
CORE_PARAM_KEYS = [
    "freq_below_avg_scale",
    "freq_above_avg_scale",
    "streak_near_max_penalty",
    "gap_above_avg_bonus_scale",
    "gap_below_avg_penalty_scale",
]

# 52회차 목표: 등수별 당첨 발생 회차 수 (작업지시.md)
TARGET_DRAWS_PER_TIER: dict[int, int] = {
    1: 1,
    2: 1,
    3: 12,
    4: 24,
    5: 52,
}


def _normalize_draws_per_tier(d: dict) -> dict[int, int]:
    """JSON 등에서 온 draws_per_tier 키를 int로 정규화."""
    return {int(k): int(v) for k, v in (d or {}).items()}


def _target_distance(draws_per_tier: dict) -> int:
    """
    목표(TARGET_DRAWS_PER_TIER) 대비 L1 부족분. 작을수록 목표에 가까움.
    상위 등수 부족에 가중치를 두어 1·2·3등 근접을 우선시.
    """
    d = _normalize_draws_per_tier(draws_per_tier)
    weights = {1: 10, 2: 8, 3: 5, 4: 2, 5: 1}
    loss = 0
    for tier, target in TARGET_DRAWS_PER_TIER.items():
        actual = d.get(tier, 0)
        shortfall = max(0, target - actual)
        loss += shortfall * weights.get(tier, 1)
    return loss


def _tier_satisfaction_count(draws_per_tier: dict) -> int:
    """목표(TARGET_DRAWS_PER_TIER)를 충족한 등수 개수 (0~5). 클수록 좋음."""
    d = _normalize_draws_per_tier(draws_per_tier)
    return sum(1 for tier, target in TARGET_DRAWS_PER_TIER.items() if d.get(tier, 0) >= target)


def _result_sort_key(entry: dict[str, Any], use_tier_count: bool = True) -> tuple:
    """results_log 항목 정렬용 키. use_tier_count면 등수별 목표 충족 개수 1순위."""
    draws = entry.get("draws_per_tier", {})
    tail = (
        -entry.get("draws_with_ge3", 0),
        -entry.get("draws_with_ge4", 0),
        _target_distance(draws),
    )
    if use_tier_count:
        return (
            -_tier_satisfaction_count(draws),
            -entry.get("weighted_score", 0),
            -entry.get("num_hit_draws", 0),
            *tail,
        )
    return (
        -entry.get("weighted_score", 0),
        -entry.get("num_hit_draws", 0),
        *tail,
    )


def _metrics_only_entry(
    draws_per_tier: dict[int, int],
    num_hit: int,
    score: int,
    ge3: int,
    ge4: int,
) -> dict[str, Any]:
    """Phase 3/C 등에서 정렬 비교용 최소 엔트리."""
    return {
        "draws_per_tier": draws_per_tier,
        "num_hit_draws": num_hit,
        "weighted_score": score,
        "draws_with_ge3": ge3,
        "draws_with_ge4": ge4,
    }


def _is_better_eval(candidate: dict[str, Any], current: dict[str, Any] | None, use_tier_count: bool = True) -> bool:
    """candidate가 current보다 정렬상 우수하면 True."""
    if current is None:
        return True
    return _result_sort_key(candidate, use_tier_count) < _result_sort_key(current, use_tier_count)


def _weighted_score(draws_per_tier: dict[int, int]) -> int:
    """등수별 당첨 발생 회차 수 가중 점수 (상위 등수 우선)."""
    return (
        draws_per_tier.get(5, 0) * 1
        + draws_per_tier.get(4, 0) * 3
        + draws_per_tier.get(3, 0) * 10
        + draws_per_tier.get(2, 0) * 50
        + draws_per_tier.get(1, 0) * 100
    )


def _evaluate_params(
    params: dict[str, Any],
    verbose: bool = False,
    relaxed_pass: int | None = None,
) -> tuple[bool, dict[int, int], int, int, int, int]:
    """한 파라미터 조합에 대해 52회 x 28세트 생성 후 합격·등수별 회차 수·당첨 회차 수·가중 점수·Top8 이론 상한(ge3, ge4) 반환.
    relaxed_pass 지정 시 당첨 발생 회차 수 >= relaxed_pass 이면 합격으로 간주."""
    generate_52_twenty_eight_sets(
        params=params,
        method_name=TUNE_METHOD_NAME,
    )
    pass_threshold = relaxed_pass if relaxed_pass is not None else TOTAL_DRAWS
    passed, draws_per_tier, num_hit_draws = analyze_52_by_tier(
        method_name=TUNE_METHOD_NAME,
        verbose=verbose,
        pass_by_draw=True,
        pass_threshold=pass_threshold,
    )
    score = _weighted_score(draws_per_tier)
    cov = compute_top8_coverage_metrics(params, DRAW_NOS)
    ge3 = int(cov["draws_with_ge3"])
    ge4 = int(cov["draws_with_ge4"])
    return passed, draws_per_tier, num_hit_draws, score, ge3, ge4


def _result_row(
    passed: bool,
    params: dict[str, Any],
    draws_per_tier: dict[int, int],
    num_hit: int,
    score: int,
    ge3: int,
    ge4: int,
) -> dict[str, Any]:
    """results_log 항목 한 줄."""
    return {
        "params": dict(params),
        "passed": passed,
        "num_hit_draws": num_hit,
        "weighted_score": score,
        "draws_per_tier": draws_per_tier,
        "draws_with_ge3": ge3,
        "draws_with_ge4": ge4,
    }


def _ensure_state_dir() -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)


def _apply_phase0_best() -> None:
    """Phase 0 결과가 있으면 DEFAULTS에 반영 (Phase 1/2/3 단독 실행 시 사용)."""
    if not PHASE0_BEST_JSON.exists():
        return
    with open(PHASE0_BEST_JSON, encoding="utf-8") as f:
        data = json.load(f)
    params = data.get("params") or data
    if "window_size" in params:
        DEFAULTS["window_size"] = params["window_size"]
    if "recent_n" in params:
        DEFAULTS["recent_n"] = params["recent_n"]


def run_phase0(
    stop_on_pass: bool,
    use_wide: bool = False,
    relaxed_pass: int | None = None,
) -> dict[str, Any]:
    """Phase 0: 구조 파라미터(window_size, recent_n) 그리드 탐색, 최적 구조 확정 후 DEFAULTS 반영."""
    grid = PHASE0_GRID_WIDE if use_wide else PHASE0_GRID
    pass_threshold = relaxed_pass if relaxed_pass is not None else TOTAL_DRAWS
    print("[Phase 0] 구조 파라미터 탐색 (window_size x recent_n)" + (" [확장 그리드]" if use_wide else ""))
    _ensure_state_dir()
    keys = list(grid.keys())
    value_lists = [grid[k] for k in keys]
    all_combos = list(itertools.product(*value_lists))
    best_metrics: dict[str, Any] | None = None
    best_score = -1
    best_params: dict[str, Any] | None = None
    best_draws_per_tier: dict[int, int] | None = None
    for i, combo_values in enumerate(all_combos):
        params = dict(DEFAULTS)
        params.update(zip(keys, combo_values))
        _, draws_per_tier, num_hit, score, ge3, ge4 = _evaluate_params(params, verbose=False, relaxed_pass=relaxed_pass)
        m = _metrics_only_entry(draws_per_tier, num_hit, score, ge3, ge4)
        print(
            f"  Phase 0 진행: {i+1}/{len(all_combos)} (window_size={params['window_size']}, recent_n={params['recent_n']}, "
            f"당첨회차={num_hit}, 점수={score}, ge3={ge3})"
        )
        if _is_better_eval(m, best_metrics):
            best_metrics = m
            best_score = score
            best_params = dict(params)
            best_draws_per_tier = draws_per_tier
        if stop_on_pass and num_hit >= pass_threshold:
            break
    if best_params is not None:
        DEFAULTS["window_size"] = best_params["window_size"]
        DEFAULTS["recent_n"] = best_params["recent_n"]
        with open(PHASE0_BEST_JSON, "w", encoding="utf-8") as f:
            json.dump({
                "params": {"window_size": DEFAULTS["window_size"], "recent_n": DEFAULTS["recent_n"]},
                "weighted_score": best_score,
                "draws_per_tier": best_draws_per_tier,
                "draws_with_ge3": best_metrics.get("draws_with_ge3") if best_metrics else 0,
                "draws_with_ge4": best_metrics.get("draws_with_ge4") if best_metrics else 0,
            }, f, indent=2, ensure_ascii=False)
        print(f"[Phase 0] 완료. 최적 구조: window_size={DEFAULTS['window_size']}, recent_n={DEFAULTS['recent_n']} (점수={best_score})")
    return best_params or {}


def run_phase_a(stop_on_pass: bool, relaxed_pass: int | None = None) -> dict[str, Any]:
    """Phase A (Round 2): JL 확장 팩터 독립 스윕. 기존 5개+구조는 DEFAULTS 고정."""
    _apply_phase0_best()
    pass_threshold = relaxed_pass if relaxed_pass is not None else TOTAL_DRAWS
    print("[Phase A] JL 확장 팩터 독립 스윕 (기존 5개+구조 고정)")
    _ensure_state_dir()
    base_params = dict(DEFAULTS)
    _, _, _, baseline_score, _, _ = _evaluate_params(base_params, verbose=False, relaxed_pass=relaxed_pass)
    print(f"  기준선(확장 무효): 점수={baseline_score}")

    top3_by_param: dict[str, list[Any]] = {}
    best_jl_params: dict[str, Any] = {}
    total = sum(len(vals) for vals in PHASE_A_GRID.values())
    idx = 0
    for param_name, values in PHASE_A_GRID.items():
        results_for_param: list[tuple[Any, int, int, int]] = []
        for v in values:
            params = dict(base_params)
            params[param_name] = v
            _, draws_per_tier, num_hit, score, ge3, _ge4 = _evaluate_params(params, verbose=False, relaxed_pass=relaxed_pass)
            results_for_param.append((v, num_hit, score, ge3))
            idx += 1
            print(f"  Phase A 진행: {idx}/{total} ({param_name}={v}, 당첨회차={num_hit}, 점수={score})")
            if stop_on_pass and num_hit >= pass_threshold:
                break
        results_for_param.sort(key=lambda x: (-x[2], -x[1], -x[3], x[0]))
        top3_by_param[param_name] = [x[0] for x in results_for_param[:3]]
        if results_for_param:
            best_jl_params[param_name] = results_for_param[0][0]
        print(f"  {param_name} 상위 3개: {top3_by_param[param_name]}")
    out = {
        "top3_by_param": top3_by_param,
        "best_jl_params": best_jl_params,
        "baseline_score": baseline_score,
    }
    with open(PHASE_A_TOP3_JSON, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"[Phase A] 완료. 저장: {PHASE_A_TOP3_JSON}")
    return out


def run_phase_b(
    stop_on_pass: bool,
    resume: bool = False,
    relaxed_pass: int | None = None,
) -> list[dict[str, Any]]:
    """Phase B (Round 2): Phase A best_jl + Phase 1 Top3 기반 3^5 그리드 탐색."""
    _apply_phase0_best()
    pass_threshold = relaxed_pass if relaxed_pass is not None else TOTAL_DRAWS
    if not PHASE_A_TOP3_JSON.exists():
        print("[Phase B] Phase A 결과가 없습니다. --phase a 를 먼저 실행하세요.")
        return []
    with open(PHASE_A_TOP3_JSON, encoding="utf-8") as f:
        phase_a = json.load(f)
    best_jl = phase_a.get("best_jl_params") or {}

    if not PHASE1_TOP3_JSON.exists():
        print("[Phase B] Phase 1 결과가 없습니다. --phase 1 을 먼저 실행하세요.")
        return []
    with open(PHASE1_TOP3_JSON, encoding="utf-8") as f:
        top3_by_param = json.load(f)

    base_params = dict(DEFAULTS)
    base_params.update(best_jl)
    keys = list(top3_by_param.keys())
    value_lists = [top3_by_param[k] for k in keys]
    all_combos = list(itertools.product(*value_lists))
    total = len(all_combos)
    start_idx = 0
    passed_combos: list[dict[str, Any]] = []
    results_log: list[dict[str, Any]] = []

    if resume and PHASE2_PROGRESS_JSON.exists():
        with open(PHASE2_PROGRESS_JSON, encoding="utf-8") as f:
            data = json.load(f)
        start_idx = data.get("last_index", 0)
        results_log = data.get("results_log", [])
        passed_combos = data.get("passed_combos", [])
        print(f"  재시작: {start_idx}/{total} 부터 진행")

    print(f"[Phase B] JL 확장 고정 + 3^{len(keys)} 그리드 탐색 ({total} 조합)")
    _ensure_state_dir()
    start_time = time.perf_counter()
    for i in range(start_idx, total):
        params = dict(base_params)
        params.update(zip(keys, all_combos[i]))
        passed, draws_per_tier, num_hit, score, ge3, ge4 = _evaluate_params(params, verbose=False, relaxed_pass=relaxed_pass)
        elapsed = time.perf_counter() - start_time
        results_log.append(_result_row(passed, params, draws_per_tier, num_hit, score, ge3, ge4))
        if passed:
            passed_combos.append(params)
            print(f"  [합격] #{i+1}/{total} 당첨회차={num_hit} 점수={score} ge3={ge3}")
            if stop_on_pass:
                with open(RESULTS_JSON, "w", encoding="utf-8") as f:
                    json.dump({"passed_combos": passed_combos, "results_log": results_log}, f, indent=2, ensure_ascii=False)
                return passed_combos
        if (i + 1) % 50 == 0 or i == 0 or passed:
            rate = (i + 1 - start_idx) / max(0.001, elapsed) if elapsed > 0 else 0
            remaining = (total - i - 1) / rate if rate > 0 else 0
            print(f"  진행: {i+1}/{total} ({100*(i+1)/total:.1f}%) | 당첨회차={num_hit} 점수={score} | 예상 남은 약 {remaining/60:.1f}분")
        if (i + 1) % 100 == 0:
            with open(PHASE2_PROGRESS_JSON, "w", encoding="utf-8") as f:
                json.dump({"last_index": i + 1, "results_log": results_log, "passed_combos": passed_combos}, f, indent=2, ensure_ascii=False)
    with open(RESULTS_JSON, "w", encoding="utf-8") as f:
        json.dump({"passed_combos": passed_combos, "results_log": results_log}, f, indent=2, ensure_ascii=False)
    print(f"[Phase B] 완료. 합격 조합 수: {len(passed_combos)}, 결과: {RESULTS_JSON}")
    return passed_combos


def run_phase_c(top_k: int = 5, fine_steps: int = 7, perturb: float = 0.10) -> None:
    """Phase C (Round 2): Phase B 상위 K개 주변 ±perturb 미세 조정 (코어+JL 확장 모두)."""
    _apply_phase0_best()
    if not RESULTS_JSON.exists():
        print("[Phase C] Phase B 결과가 없습니다. Phase B를 먼저 실행하세요.")
        return
    with open(RESULTS_JSON, encoding="utf-8") as f:
        data = json.load(f)
    results_log = data.get("results_log", [])
    if not results_log:
        print("[Phase C] results_log 비어 있음.")
        return
    results_log.sort(key=lambda x: _result_sort_key(x, use_tier_count=True))
    top_k_results = results_log[:top_k]
    print(f"[Phase C] 상위 {top_k}개 주변 ±{int(perturb*100)}% 미세 조정 (파라미터당 {fine_steps}단계)")
    best_metrics: dict[str, Any] | None = None
    best_score = -1
    best_params: dict[str, Any] | None = None
    best_draws_per_tier: dict[int, int] | None = None
    tune_keys = [k for k in CORE_PARAM_KEYS + list(PHASE_A_GRID.keys()) if k != "use_gap_exponential"]
    for rec in top_k_results:
        params = dict(rec["params"])
        for use_exp in (False, True):
            p2 = dict(params)
            p2["use_gap_exponential"] = use_exp
            _, draws_per_tier, num_hit, score, ge3, ge4 = _evaluate_params(p2, verbose=False)
            m = _metrics_only_entry(draws_per_tier, num_hit, score, ge3, ge4)
            if _is_better_eval(m, best_metrics):
                best_metrics = m
                best_score = score
                best_params = dict(p2)
                best_draws_per_tier = draws_per_tier
        for param_name in tune_keys:
            if param_name not in params:
                continue
            base = params[param_name]
            if isinstance(base, bool):
                continue
            if isinstance(base, (int, float)):
                low = base * (1.0 - perturb) if base != 0 else 0.01
                high = base * (1.0 + perturb) if base != 0 else 1.0
                low = max(0.01, min(low, high - 0.01))
                step = (high - low) / max(1, fine_steps - 1) if high != low else 0
                for s in range(fine_steps):
                    v = low + step * s if step else base
                    v = round(v, 3) if isinstance(base, float) else max(1, int(round(v)))
                    p2 = dict(params)
                    p2[param_name] = v
                    _, draws_per_tier, num_hit, score, ge3, ge4 = _evaluate_params(p2, verbose=False)
                    m = _metrics_only_entry(draws_per_tier, num_hit, score, ge3, ge4)
                    if _is_better_eval(m, best_metrics):
                        best_metrics = m
                        best_score = score
                        best_params = dict(p2)
                        best_draws_per_tier = draws_per_tier
    if best_params is not None:
        print(f"[Phase C] 미세 조정 최적: 가중점수={best_score}, 당첨회차={sum(best_draws_per_tier.values()) if best_draws_per_tier else 0}")
        print("  draws_per_tier:", best_draws_per_tier)
        if best_metrics:
            print(f"  draws_with_ge3={best_metrics.get('draws_with_ge3')}, draws_with_ge4={best_metrics.get('draws_with_ge4')}")
        print("  jl_service3.py / run_jl3_auto_tune DEFAULTS 반영용:")
        for k, v in best_params.items():
            print(f"    {k} = {v}")
        with open(PHASE_C_BEST_JSON, "w", encoding="utf-8") as f:
            json.dump({
                "params": best_params,
                "weighted_score": best_score,
                "draws_per_tier": best_draws_per_tier,
                "draws_with_ge3": best_metrics.get("draws_with_ge3") if best_metrics else 0,
                "draws_with_ge4": best_metrics.get("draws_with_ge4") if best_metrics else 0,
            }, f, indent=2, ensure_ascii=False)
        print(f"  저장: {PHASE_C_BEST_JSON}")
    return


def run_phase1(
    stop_on_pass: bool,
    top_k: int = 3,
    use_coarse: bool = False,
    relaxed_pass: int | None = None,
) -> dict[str, list[Any]]:
    """Phase 1: 파라미터별 독립 스윕, 상위 top_k개 후보값 선정. use_coarse면 넓은 범위 그리드 사용."""
    _apply_phase0_best()
    pass_threshold = relaxed_pass if relaxed_pass is not None else TOTAL_DRAWS
    grid = PHASE1_GRID_COARSE if use_coarse else PHASE1_GRID
    print("[Phase 1] 독립 파라미터 스윕 시작" + (" [coarse 넓은 범위]" if use_coarse else "") + f" (상위 {top_k}개)")
    _ensure_state_dir()
    top3_by_param: dict[str, list[Any]] = {}
    total = sum(len(vals) for vals in grid.values())
    idx = 0
    for param_name, values in grid.items():
        results_for_param: list[tuple[Any, int, int, int]] = []
        for v in values:
            params = dict(DEFAULTS)
            params[param_name] = v
            _, draws_per_tier, num_hit, score, ge3, _ge4 = _evaluate_params(params, verbose=False, relaxed_pass=relaxed_pass)
            results_for_param.append((v, num_hit, score, ge3))
            idx += 1
            print(f"  Phase 1 진행: {idx}/{total} ({param_name}={v}, 당첨회차={num_hit}, 점수={score})")
            if stop_on_pass and num_hit >= pass_threshold:
                print(f"  [합격] {params} → 당첨 회차 수 {num_hit}")
        results_for_param.sort(key=lambda x: (-x[2], -x[1], -x[3], x[0]))
        top_k_values = [x[0] for x in results_for_param[:top_k]]
        top3_by_param[param_name] = top_k_values
        print(f"  {param_name} 상위 {top_k}개: {top_k_values}")
    with open(PHASE1_TOP3_JSON, "w", encoding="utf-8") as f:
        json.dump(top3_by_param, f, indent=2, ensure_ascii=False)
    print(f"[Phase 1] 완료. 상위 {top_k}개 저장: {PHASE1_TOP3_JSON}")
    return top3_by_param


def _reduce_to_three(values: list[Any]) -> list[Any]:
    """Phase 1에서 상위 5개 저장 시 Phase 2용 3개로 압축 (최소/중간/최대)."""
    if len(values) <= 3:
        return values[:3]
    return [values[0], values[len(values) // 2], values[-1]]


def run_phase2(
    top3_by_param: dict[str, list[Any]] | None,
    stop_on_pass: bool,
    resume: bool,
    relaxed_pass: int | None = None,
) -> list[dict[str, Any]]:
    """Phase 2: 3^5 축소 전수 그리드 탐색. 재시작 지원. Phase 1이 5개 저장 시 3개로 압축해 사용."""
    if top3_by_param is None and PHASE1_TOP3_JSON.exists():
        with open(PHASE1_TOP3_JSON, encoding="utf-8") as f:
            top3_by_param = json.load(f)
    if not top3_by_param:
        print("[Phase 2] Phase 1 결과가 없습니다. --phase 1 을 먼저 실행하세요.")
        return []

    _apply_phase0_best()
    pass_threshold = relaxed_pass if relaxed_pass is not None else TOTAL_DRAWS
    # Phase 1에서 top5 저장 시 3개로 압축해 3^5 유지
    value_lists = [_reduce_to_three(top3_by_param[k]) for k in top3_by_param]
    keys = list(top3_by_param.keys())
    n_per = len(value_lists[0])
    print(f"[Phase 2] 축소 전수 그리드 탐색 ({n_per}^{len(keys)} = {n_per ** len(keys)} 조합)")
    _ensure_state_dir()
    all_combos = list(itertools.product(*value_lists))
    total = len(all_combos)
    start_idx = 0
    passed_combos: list[dict[str, Any]] = []
    results_log: list[dict[str, Any]] = []

    if resume and PHASE2_PROGRESS_JSON.exists():
        with open(PHASE2_PROGRESS_JSON, encoding="utf-8") as f:
            data = json.load(f)
        start_idx = data.get("last_index", 0)
        results_log = data.get("results_log", [])
        passed_combos = data.get("passed_combos", [])
        print(f"  재시작: {start_idx}/{total} 부터 진행")

    start_time = time.perf_counter()
    for i in range(start_idx, total):
        combo_values = all_combos[i]
        params = dict(DEFAULTS)
        params.update(zip(keys, combo_values))
        passed, draws_per_tier, num_hit, score, ge3, ge4 = _evaluate_params(params, verbose=False, relaxed_pass=relaxed_pass)
        elapsed = time.perf_counter() - start_time
        results_log.append(_result_row(passed, params, draws_per_tier, num_hit, score, ge3, ge4))
        if passed:
            passed_combos.append(params)
            print(f"  [합격] #{i+1}/{total} 당첨회차={num_hit} 점수={score} ge3={ge3} params={params}")
            if stop_on_pass:
                print("  --stop-on-pass: 종료합니다.")
                with open(RESULTS_JSON, "w", encoding="utf-8") as f:
                    json.dump({"passed_combos": passed_combos, "results_log": results_log}, f, indent=2, ensure_ascii=False)
                return passed_combos
        if (i + 1) % 50 == 0 or i == 0 or passed:
            rate = (i + 1 - start_idx) / max(0.001, elapsed) if elapsed > 0 else 0
            remaining = (total - i - 1) / rate if rate > 0 else 0
            print(f"  진행: {i+1}/{total} ({100*(i+1)/total:.1f}%) | 당첨회차={num_hit} 점수={score} | 예상 남은 약 {remaining/60:.1f}분")
        if (i + 1) % 100 == 0:
            with open(PHASE2_PROGRESS_JSON, "w", encoding="utf-8") as f:
                json.dump({
                    "last_index": i + 1,
                    "results_log": results_log,
                    "passed_combos": passed_combos,
                }, f, indent=2, ensure_ascii=False)

    with open(RESULTS_JSON, "w", encoding="utf-8") as f:
        json.dump({"passed_combos": passed_combos, "results_log": results_log}, f, indent=2, ensure_ascii=False)
    print(f"[Phase 2] 완료. 합격 조합 수: {len(passed_combos)}, 결과: {RESULTS_JSON}")
    return passed_combos


def run_phase3(top_k: int = 5, fine_steps: int = 7, perturb: float = 0.07) -> None:
    """Phase 3: Phase 2 결과 상위 K개 주변 ±perturb 미세 조정 (파라미터당 fine_steps단계). perturb 기본 0.07(±7%), 0.15 가능."""
    _apply_phase0_best()
    if not RESULTS_JSON.exists():
        print("[Phase 3] Phase 2 결과가 없습니다. Phase 2를 먼저 실행하세요.")
        return
    with open(RESULTS_JSON, encoding="utf-8") as f:
        data = json.load(f)
    results_log = data.get("results_log", [])
    if not results_log:
        print("[Phase 3] results_log 비어 있음.")
        return
    results_log.sort(key=lambda x: _result_sort_key(x, use_tier_count=True))
    top_k_results = results_log[:top_k]
    print(f"[Phase 3] 상위 {top_k}개 조합 주변 ±{int(perturb*100)}% 미세 조정 (파라미터당 {fine_steps}단계)")
    best_metrics: dict[str, Any] | None = None
    best_score = -1
    best_params: dict[str, Any] | None = None
    best_draws_per_tier: dict[int, int] | None = None
    for rec in top_k_results:
        params = dict(rec["params"])
        for param_name in CORE_PARAM_KEYS:
            if param_name not in params:
                continue
            base = params[param_name]
            if not isinstance(base, (int, float)):
                continue
            low = base * (1.0 - perturb) if base != 0 else 0.01
            high = base * (1.0 + perturb) if base != 0 else 1.0
            low = max(0.01, min(low, high - 0.01))
            step = (high - low) / max(1, fine_steps - 1) if high != low else 0
            for s in range(fine_steps):
                v = low + step * s if step else base
                v = round(v, 3) if isinstance(base, float) else max(1, int(round(v)))
                p2 = dict(params)
                p2[param_name] = v
                _, draws_per_tier, num_hit, score, ge3, ge4 = _evaluate_params(p2, verbose=False)
                m = _metrics_only_entry(draws_per_tier, num_hit, score, ge3, ge4)
                if _is_better_eval(m, best_metrics):
                    best_metrics = m
                    best_score = score
                    best_params = dict(p2)
                    best_draws_per_tier = draws_per_tier
    if best_params is not None:
        print(f"[Phase 3] 미세 조정 최적: 가중점수={best_score}, 당첨회차={sum(best_draws_per_tier.values()) if best_draws_per_tier else 0}")
        print("  draws_per_tier:", best_draws_per_tier)
        if best_metrics:
            print(f"  draws_with_ge3={best_metrics.get('draws_with_ge3')}, draws_with_ge4={best_metrics.get('draws_with_ge4')}")
        print("  jl_service3.py에 반영할 값:")
        for k, v in best_params.items():
            print(f"    {k} = {v}")
        with open(STATE_DIR / "phase3_best.json", "w", encoding="utf-8") as f:
            json.dump({
                "params": best_params,
                "weighted_score": best_score,
                "draws_per_tier": best_draws_per_tier,
                "draws_with_ge3": best_metrics.get("draws_with_ge3") if best_metrics else 0,
                "draws_with_ge4": best_metrics.get("draws_with_ge4") if best_metrics else 0,
            }, f, indent=2, ensure_ascii=False)
    return


def main() -> None:
    parser = argparse.ArgumentParser(description="JL3 기법 자동 튜닝 (Phase 0~3, Round2 a/b/c)")
    parser.add_argument(
        "--phase",
        type=str,
        choices=["0", "1", "2", "3", "a", "b", "c"],
        default="0",
        help="0=전체(0→1→2→3), 1~3=기존 Phase, a=JL확장 스윕, b=확장+코어 그리드, c=미세조정",
    )
    parser.add_argument("--stop-on-pass", action="store_true", help="첫 합격 조합 발견 시 즉시 종료")
    parser.add_argument("--resume", action="store_true", help="Phase 2/B 재시작 (저장된 진행부터)")
    parser.add_argument("--phase0-wide", action="store_true", help="Phase 0 확장 그리드 사용 (window_size/recent_n 더 다양한 값)")
    parser.add_argument(
        "--phase0-only",
        action="store_true",
        help="--phase 0 일 때 Phase 0(구조 그리드)만 실행 후 종료. 미지정 시 기존과 같이 0→1→2→3 전체 실행",
    )
    parser.add_argument("--phase1-top", type=int, default=3, choices=[3, 5], help="Phase 1 파라미터당 상위 후보 개수 (3 또는 5)")
    parser.add_argument("--phase1-coarse", action="store_true", help="Phase 1 넓은 범위 그리드 사용 (coarse)")
    parser.add_argument("--phase3-perturb", type=float, default=0.07, help="Phase 3 미세 조정 범위 (기본 0.07=±7%%, 0.15=±15%%)")
    parser.add_argument("--relaxed-pass", type=int, default=None, metavar="N", help="합격 기준 완화: 당첨 발생 회차 수 >= N 이면 합격 (기본 52)")
    args = parser.parse_args()

    relaxed = args.relaxed_pass

    if args.phase == "a":
        run_phase_a(stop_on_pass=args.stop_on_pass, relaxed_pass=relaxed)
        return
    if args.phase == "b":
        run_phase_b(stop_on_pass=args.stop_on_pass, resume=args.resume, relaxed_pass=relaxed)
        return
    if args.phase == "c":
        run_phase_c()
        return

    if args.phase == "0":
        run_phase0(stop_on_pass=args.stop_on_pass, use_wide=args.phase0_wide, relaxed_pass=relaxed)
        if args.phase0_only:
            return
        if args.stop_on_pass:
            return
        top3 = run_phase1(stop_on_pass=args.stop_on_pass, top_k=args.phase1_top, use_coarse=args.phase1_coarse, relaxed_pass=relaxed)
        if args.stop_on_pass:
            return
        run_phase2(top3_by_param=top3, stop_on_pass=args.stop_on_pass, resume=False, relaxed_pass=relaxed)
        run_phase3(perturb=args.phase3_perturb)
        return
    if args.phase == "1":
        run_phase1(stop_on_pass=args.stop_on_pass, top_k=args.phase1_top, use_coarse=args.phase1_coarse, relaxed_pass=relaxed)
        return
    if args.phase == "2":
        run_phase2(top3_by_param=None, stop_on_pass=args.stop_on_pass, resume=args.resume, relaxed_pass=relaxed)
        return
    if args.phase == "3":
        run_phase3(perturb=args.phase3_perturb)
        return


if __name__ == "__main__":
    main()
