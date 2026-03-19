# -*- coding: utf-8 -*-
"""JL3 튜닝 헬퍼·정렬 키 단위 테스트 (DB 불필요)."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[1]
SCRIPTS = BACKEND / "scripts"
for _p in (BACKEND, SCRIPTS):
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))

from run_jl3_52 import jl3_params_for_top8  # noqa: E402
from run_jl3_auto_tune import (  # noqa: E402
    _is_better_eval,
    _metrics_only_entry,
    _result_sort_key,
)


def test_jl3_params_for_top8_strips_generate_only_keys() -> None:
    raw = {
        "window_size": 390,
        "apply_sum_filter": False,
        "apply_odd_even_filter": True,
        "sum_margin_ratio": 0.05,
        "odd_even_min_ratio": 0.02,
        "freq_below_avg_scale": 2.0,
    }
    top8 = jl3_params_for_top8(raw)
    assert "apply_sum_filter" not in top8
    assert "apply_odd_even_filter" not in top8
    assert "sum_margin_ratio" not in top8
    assert "odd_even_min_ratio" not in top8
    assert top8["window_size"] == 390
    assert top8["freq_below_avg_scale"] == 2.0


def test_result_sort_key_prefers_higher_draws_with_ge3_on_tie() -> None:
    base_draws = {1: 0, 2: 0, 3: 0, 4: 2, 5: 10}
    a = {
        "draws_per_tier": base_draws,
        "weighted_score": 16,
        "num_hit_draws": 12,
        "draws_with_ge3": 13,
        "draws_with_ge4": 2,
    }
    b = {
        "draws_per_tier": dict(base_draws),
        "weighted_score": 16,
        "num_hit_draws": 12,
        "draws_with_ge3": 14,
        "draws_with_ge4": 2,
    }
    assert _result_sort_key(b, use_tier_count=True) < _result_sort_key(a, use_tier_count=True)


def test_is_better_eval_respects_full_order() -> None:
    worse = _metrics_only_entry({1: 0, 2: 0, 3: 0, 4: 1, 5: 8}, 9, 11, 12, 1)
    better = _metrics_only_entry({1: 0, 2: 0, 3: 0, 4: 2, 5: 8}, 10, 14, 13, 2)
    assert _is_better_eval(better, worse, use_tier_count=True)
    assert not _is_better_eval(worse, better, use_tier_count=True)
    assert _is_better_eval(better, None, use_tier_count=True)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
