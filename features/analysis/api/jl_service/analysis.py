# -*- coding: utf-8 -*-
"""
JL 휠 — 당첨 분석.

생성된 세트를 실제 당첨번호와 비교하여 등수를 판정하고,
교체 전/후 중복 상태를 분석한다.
"""
from __future__ import annotations

from typing import Any, Dict, List

from backend.domain.services.lotto_rank import rank_lotto_ticket

from .dedup import _find_duplicate_groups, _rows_to_number_lists
from .generator import generate_jl_wheel_sets
from .start_numbers import _fetch_winner_for_draw


def _build_hit_rows(
    rows: List[Dict[str, object]],
    winning_main: set[int],
    bonus: int,
) -> List[Dict[str, object]]:
    """생성된 세트 중 5등 이상 당첨을 필터링한다."""
    hits: List[Dict[str, object]] = []
    for r in rows:
        nums = {
            int(r["num1"]),
            int(r["num2"]),
            int(r["num3"]),
            int(r["num4"]),
            int(r["num5"]),
            int(r["num6"]),
        }
        rank = rank_lotto_ticket(winning_main, bonus, nums)
        if rank is None:
            continue
        hits.append(
            {
                "set_index": int(r["set_index"]),
                "rank": int(rank),
                "numbers": sorted(nums),
                "offset": int(r["profile_offset"]),
            }
        )
    hits.sort(key=lambda x: (int(x["rank"]), int(x["set_index"])))  # type: ignore[index]
    return hits


def analyze_draw_duplicate_sets(draw_no: int, *, count: int = 20) -> Dict[str, Any]:
    """
    특정 회차의 세트 중복(교체 전/후)과 당첨 세트 번호를 함께 분석.

    - raw_pre_replace: 시작번호 다양화·사후교체 모두 비활성
    - diversified_pre_replace: 시작번호 다양화만 활성
    - final_post_replace: 다양화 + 사후교체 (기본 동작)
    """
    if draw_no <= 0:
        raise ValueError("draw_no must be positive")
    if not 1 <= count <= 20:
        raise ValueError("count는 1~20만 허용합니다.")

    winner = _fetch_winner_for_draw(draw_no)
    if winner is None:
        raise ValueError(f"draw_no={draw_no} 당첨 데이터가 없습니다.")
    winning_main, bonus = winner

    raw_rows = generate_jl_wheel_sets(
        draw_no,
        count=count,
        dedup_across_sets=False,
        prevent_duplicates_before_replace=False,
    )
    diversified_rows = generate_jl_wheel_sets(
        draw_no,
        count=count,
        dedup_across_sets=False,
        prevent_duplicates_before_replace=True,
    )
    final_rows = generate_jl_wheel_sets(
        draw_no,
        count=count,
        dedup_across_sets=True,
        prevent_duplicates_before_replace=True,
    )

    raw_nums = _rows_to_number_lists(raw_rows)
    diversified_nums = _rows_to_number_lists(diversified_rows)
    final_nums = _rows_to_number_lists(final_rows)

    return {
        "draw_no": draw_no,
        "count": count,
        "winning_numbers": sorted(winning_main),
        "bonus_number": bonus,
        "raw_pre_replace": {
            "duplicate_groups": _find_duplicate_groups(raw_nums),
            "duplicate_set_count": sum(
                len(g["set_indexes"]) for g in _find_duplicate_groups(raw_nums)  # type: ignore[index]
            ),
            "hit_sets": _build_hit_rows(raw_rows, winning_main, bonus),
        },
        "diversified_pre_replace": {
            "duplicate_groups": _find_duplicate_groups(diversified_nums),
            "duplicate_set_count": sum(
                len(g["set_indexes"]) for g in _find_duplicate_groups(diversified_nums)  # type: ignore[index]
            ),
            "hit_sets": _build_hit_rows(diversified_rows, winning_main, bonus),
        },
        "final_post_replace": {
            "duplicate_groups": _find_duplicate_groups(final_nums),
            "duplicate_set_count": sum(
                len(g["set_indexes"]) for g in _find_duplicate_groups(final_nums)  # type: ignore[index]
            ),
            "hit_sets": _build_hit_rows(final_rows, winning_main, bonus),
        },
    }
