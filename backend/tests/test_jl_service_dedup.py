# -*- coding: utf-8 -*-
"""JL 세트 중복 사후 교체 규칙 테스트."""

from collections import Counter

from domain.services.analysis.jl_service import (
    _build_hit_rows,
    _diversify_start_nums,
    _find_duplicate_groups,
    _draw_unique_set_with_variants,
    _rotate_start_nums,
    _replace_duplicate_sets_by_frequency,
    _replacement_pool_from_frequency,
)


def test_replacement_pool_prefers_low_frequency_then_small_number() -> None:
    """교체 후보 풀은 빈도 오름차순, 동률 시 번호 오름차순이어야 한다."""
    freq = Counter({1: 5, 2: 0, 3: 0, 4: 1, 5: 0})
    pool = _replacement_pool_from_frequency(freq, size=5)
    assert pool[:5] == [2, 3, 5, 6, 7]


def test_replace_duplicate_sets_keeps_set1_and_resolves_duplicates() -> None:
    """세트#1 유지, 세트#2부터 중복 조합만 교체한다."""
    sets = [
        [1, 2, 3, 4, 5, 6],  # set#1 유지
        [1, 2, 3, 4, 5, 6],  # set#2 중복 -> 교체 대상
        [1, 2, 3, 4, 5, 6],  # set#3 중복 -> 교체 대상
    ]
    # 1번이 최다 빈도이므로 먼저 교체되어야 함.
    freq = Counter({1: 100, 2: 10, 3: 9, 4: 8, 5: 7, 6: 6})
    # 후보는 낮은 번호부터 순차 사용.
    replacement_pool = [7, 8, 9, 10]

    out = _replace_duplicate_sets_by_frequency(
        sets,
        freq=freq,
        replacement_pool=replacement_pool,
    )

    assert out[0] == [1, 2, 3, 4, 5, 6]
    assert out[1] == [2, 3, 4, 5, 6, 7]
    assert out[2] == [2, 3, 4, 5, 6, 8]
    assert len({frozenset(x) for x in out}) == 3


def test_rotate_start_nums_is_deterministic() -> None:
    base = [11, 22, 33, 44, 5, 6]
    assert _rotate_start_nums(base, 0) == [11, 22, 33, 44, 5, 6]
    assert _rotate_start_nums(base, 2) == [33, 44, 5, 6, 11, 22]
    assert _rotate_start_nums(base, 8) == [33, 44, 5, 6, 11, 22]


def test_diversify_start_nums_changes_order_by_set_or_attempt() -> None:
    base = [1, 2, 3, 4, 5, 6]
    first = _diversify_start_nums(base, set_index=0, attempt=0)
    second = _diversify_start_nums(base, set_index=1, attempt=0)
    third = _diversify_start_nums(base, set_index=0, attempt=1)
    assert first != second
    assert first != third


def test_draw_unique_set_with_variants_respects_seen_sets() -> None:
    base = [1, 2, 3, 4, 5, 6]
    seen = {frozenset({1, 2, 3, 4, 5, 6})}
    out = _draw_unique_set_with_variants(
        top6=base,
        set_index=1,
        base_speed=82.11,
        base_decel=1.88,
        fixed_stop_time=82.11 / 1.88,
        seen_sets=seen,
        max_attempts=5,
    )
    assert frozenset(out) not in seen


def test_find_duplicate_groups_reports_grouped_set_indexes() -> None:
    nums = [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 10, 11, 12],
        [1, 2, 3, 4, 5, 6],
        [13, 14, 15, 16, 17, 18],
        [7, 8, 9, 10, 11, 12],
    ]
    groups = _find_duplicate_groups(nums)
    assert len(groups) == 2
    assert groups[0]["set_indexes"] == [1, 3]
    assert groups[1]["set_indexes"] == [2, 5]


def test_build_hit_rows_contains_set_indexes_and_rank() -> None:
    rows = [
        {
            "num1": 1,
            "num2": 2,
            "num3": 3,
            "num4": 4,
            "num5": 5,
            "num6": 6,
            "set_index": 1,
            "profile_speed": 80.0,
            "profile_deceleration": 1.0,
        },
        {
            "num1": 1,
            "num2": 2,
            "num3": 3,
            "num4": 4,
            "num5": 5,
            "num6": 7,
            "set_index": 2,
            "profile_speed": 81.0,
            "profile_deceleration": 1.01,
        },
    ]
    winning_main = {1, 2, 3, 4, 5, 6}
    bonus = 7
    hits = _build_hit_rows(rows, winning_main, bonus)
    assert len(hits) == 2
    assert hits[0]["set_index"] == 1 and hits[0]["rank"] == 1
    assert hits[1]["set_index"] == 2 and hits[1]["rank"] == 2
