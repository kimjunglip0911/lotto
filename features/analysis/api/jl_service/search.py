# -*- coding: utf-8 -*-
"""
JL 휠 — 파라미터 역탐색.

결과번호 = (시작번호 - 1 + offset) mod 45 + 1  이므로,
offset = (결과번호 - 시작번호) mod 45  로 즉시 역산 가능.
"""
from __future__ import annotations

from typing import List, Optional


def find_offset_for_number(
    target: int,
    *,
    start_num: int = 1,
) -> int:
    """target 번호를 생성하는 offset(0~44)을 반환."""
    if not 1 <= target <= 45:
        raise ValueError("target must be in 1..45")
    if not 1 <= start_num <= 45:
        raise ValueError("start_num must be in 1..45")
    return (target - start_num) % 45


def find_offsets_for_six_numbers(
    targets: List[int],
    *,
    start_nums: Optional[List[int]] = None,
) -> List[int]:
    """6개 번호 각각에 대한 offset 리스트를 반환."""
    if len(targets) != 6 or len(set(targets)) != 6:
        raise ValueError("targets must be 6 distinct numbers in 1..45")
    starts = start_nums if start_nums is not None else [1] * 6
    if len(starts) != 6:
        raise ValueError("start_nums must have length 6")
    return [find_offset_for_number(t, start_num=s) for t, s in zip(targets, starts)]
