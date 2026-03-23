# -*- coding: utf-8 -*-
"""run_wheel_52 튜닝 정책 단위 테스트."""

from scripts.run_wheel_52 import (
    _apply_alternate_delta_on_regressed_sets,
    _format_history_md,
    _weighted_hit_score,
)


def test_weighted_hit_score_prioritizes_higher_rank() -> None:
    """상위 등수 1건이 다수의 하위 등수보다 우선해야 한다."""
    high_rank_hits = [(1170, 3)]
    many_low_rank_hits = [(1170 + i, 4) for i in range(30)]

    assert _weighted_hit_score(high_rank_hits) > _weighted_hit_score(many_low_rank_hits)


def test_apply_alternate_delta_only_for_regressed_sets() -> None:
    """악화 세트만 기준 복구 후 반대 방향으로 1회 조정한다."""
    baseline = [float(70 + i) for i in range(20)]
    candidate = list(baseline)
    candidate[4] = baseline[4] + 0.35
    candidate[9] = baseline[9] + 0.35

    adjusted, touched = _apply_alternate_delta_on_regressed_sets(
        baseline,
        candidate,
        [5],
        alternate_delta=0.2,
    )

    assert touched == [5]
    assert adjusted[4] < baseline[4]
    assert adjusted[9] == candidate[9]


def test_format_history_md_keeps_fixed_layout_and_counts() -> None:
    """당첨 이력 마크다운은 고정 양식/집계를 유지해야 한다."""
    by_set_index = {i: [] for i in range(1, 21)}
    by_set_index[1] = [(1170, 5), (1171, 4)]
    by_set_index[2] = [(1171, 5)]

    result = {
        "by_set_index": by_set_index,
        "nominal_base_speeds": [80.0 + i for i in range(20)],
    }
    md = _format_history_md(result, seed=42)
    lines = md.splitlines()

    assert lines[0] == "## 2. 속도 프로파일(세트#)별 당첨 이력"
    assert "당첨 누적 회차 : 2회" in md
    assert "1등 : 0번" in md
    assert "2등 : 0번" in md
    assert "3등 : 0번" in md
    assert "4등 : 1번" in md
    assert "5등 : 2번" in md
    assert "| 세트# | speed | decel | 회차(등수) |" in md
    assert "| 1 | 80.0 |" in md
    assert "| 2 | 81.0 |" in md
    assert "1170(5등), 1171(4등)" in md
    assert "1171(5등)" in md
    assert "| 3 | 82.0 |" in md
    assert "| 3 | 82.0 | 1.877 | - |" in md
