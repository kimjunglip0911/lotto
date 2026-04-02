# -*- coding: utf-8 -*-
"""
JL 휠 — 중복 방지 로직.

세트 생성 시 동일 조합 반복을 방지하는 전략:
  1) 사전 방지: 시작번호 회전 + 이동량 미세 조정으로 중복 회피
  2) 사후 교체: 빈도 기반으로 중복 세트의 번호 1개를 저빈도 번호로 치환
"""
from __future__ import annotations

from collections import Counter
from typing import Dict, List, Optional, Tuple

from .config import (
    MAX_SET_DEDUP_RETRIES,
    PER_SET_WHEEL_STEPS,
    _JITTER_K,
    _MAX_STEPS,
    _MIN_STEPS,
    _PRE_DEDUP_SPEED_JITTER,
)
from .start_numbers import START_PERMUTATIONS
from .physics import (
    _derive_wheel_steps,
    _steps_from_offset,
    draw_six,
)


# ── 시작번호 다양화 (순열 기반) ───────────────────────────────

def _diversify_start_nums(top6: List[int], set_index: int, attempt: int) -> List[int]:
    """
    세트별 시작번호를 config.START_PERMUTATIONS 순열에 따라 재배치한다.

    - set_index: 세트 번호 (0~19)
    - attempt: 중복 재시도 횟수 (순열 인덱스를 밀어 다른 배치 시도)
    - 순열 변경: config.py의 START_PERMUTATIONS 리스트를 직접 수정
    """
    if len(top6) != 6:
        raise ValueError("top6 must have length 6")
    perm_idx = (set_index + attempt) % len(START_PERMUTATIONS)
    perm = START_PERMUTATIONS[perm_idx]
    return [top6[i] for i in perm]


# ── 사전 중복 방지 (생성 단계) ────────────────────────────────

def _draw_unique_set_with_variants(
    *,
    top6: List[int],
    set_index: int,
    base_offset: int,
    set_index_for_steps: int,
    seen_sets: set[frozenset[int]],
    max_attempts: int = MAX_SET_DEDUP_RETRIES,
) -> List[int]:
    """
    중복이면 시작번호 다양화 + 이동량 미세 조정으로 재생성한다.
    6휠 각각에 황금각 기반 독립 이동량을 항상 부여.
    """
    for attempt in range(max_attempts):
        starts = _diversify_start_nums(top6, set_index, attempt)
        base_steps = _steps_from_offset(base_offset, set_index_for_steps)
        jitter_speed = _PRE_DEDUP_SPEED_JITTER * attempt
        jitter_sign = 1.0 if attempt % 2 == 0 else -1.0
        jittered = int(base_steps + jitter_speed * jitter_sign * _JITTER_K)
        jittered = max(_MIN_STEPS, min(_MAX_STEPS, jittered))
        ws = _derive_wheel_steps(jittered, set_index=set_index_for_steps)
        nums = draw_six(starts, jittered, wheel_steps=ws)
        key = frozenset(nums)
        if key not in seen_sets:
            return nums
    fallback_steps = _steps_from_offset(base_offset, set_index_for_steps)
    ws = _derive_wheel_steps(fallback_steps, set_index=set_index_for_steps)
    nums = draw_six(
        _diversify_start_nums(top6, set_index, max_attempts - 1),
        fallback_steps,
        wheel_steps=ws,
    )
    return nums


# ── 사후 중복 교체 (빈도 기반) ────────────────────────────────

def _replacement_pool_from_frequency(
    freq: Counter[int], size: int = 20
) -> List[int]:
    """빈도 하위 번호 풀(동률 시 번호 오름차순)."""
    ordered = sorted(((n, freq.get(n, 0)) for n in range(1, 46)), key=lambda x: (x[1], x[0]))
    return [n for n, _ in ordered[: max(1, min(size, 45))]]


def _replace_duplicate_sets_by_frequency(
    set_nums: List[List[int]],
    *,
    freq: Counter[int],
    replacement_pool: List[int],
) -> List[List[int]]:
    """
    세트#1은 유지, 세트#2부터 중복 조합이면 빈도 최다 번호를 저빈도 풀에서 치환.
    """
    if not set_nums:
        return set_nums

    replaced: List[List[int]] = [sorted(set_nums[0])]
    replacement_cursor = 0
    pool_len = len(replacement_pool)
    if pool_len == 0:
        return [sorted(nums) for nums in set_nums]

    for nums in set_nums[1:]:
        candidate_nums = sorted(nums)
        while frozenset(candidate_nums) in {frozenset(x) for x in replaced}:
            max_freq = max(freq.get(n, 0) for n in candidate_nums)
            target = max((n for n in candidate_nums if freq.get(n, 0) == max_freq))
            target_index = candidate_nums.index(target)

            replacement_number: Optional[int] = None
            scanned = 0
            while scanned < pool_len:
                rep = replacement_pool[(replacement_cursor + scanned) % pool_len]
                if rep not in candidate_nums:
                    replacement_number = rep
                    replacement_cursor = (replacement_cursor + scanned + 1) % pool_len
                    break
                scanned += 1
            if replacement_number is None:
                break
            candidate_nums[target_index] = replacement_number
            candidate_nums = sorted(candidate_nums)
        replaced.append(candidate_nums)
    return replaced


# ── 유틸리티 ─────────────────────────────────────────────────

def _rows_to_number_lists(rows: List[Dict[str, object]]) -> List[List[int]]:
    """row dict 리스트를 [[num1..num6], ...] 형태로 변환."""
    return [
        [
            int(r["num1"]),
            int(r["num2"]),
            int(r["num3"]),
            int(r["num4"]),
            int(r["num5"]),
            int(r["num6"]),
        ]
        for r in rows
    ]


def _find_duplicate_groups(set_nums: List[List[int]]) -> List[Dict[str, object]]:
    """동일 조합이 반복된 세트 그룹을 반환."""
    groups: Dict[Tuple[int, ...], List[int]] = {}
    for i, nums in enumerate(set_nums, start=1):
        key = tuple(sorted(int(x) for x in nums))
        groups.setdefault(key, []).append(i)
    out: List[Dict[str, object]] = []
    for key, indexes in groups.items():
        if len(indexes) >= 2:
            out.append({"set_indexes": indexes, "numbers": list(key), "count": len(indexes)})
    out.sort(key=lambda x: (-int(x["count"]), x["set_indexes"][0]))  # type: ignore[index]
    return out
