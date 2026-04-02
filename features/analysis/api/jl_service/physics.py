# -*- coding: utf-8 -*-
"""
JL 휠 — 그리드 이동 엔진.

45칸 원형 그리드 위에서 시작번호로부터 offset만큼 이동하여 번호를 결정한다.

    결과번호 = (시작번호 - 1 + steps) mod 45 + 1

중복 번호 발생 시 이동량(steps)을 조정하여 재시도한다.
"""
from __future__ import annotations

from typing import List, Optional

from .config import (
    MAX_DUPLICATE_RETRIES,
    PER_SET_WHEEL_STEPS,
    WHEEL_OFFSET_STEPS,
    _JITTER_BASE_SPEEDS,
    _JITTER_K,
    _MAX_STEPS,
    _MIN_STEPS,
    _RETRY_SPEED_JITTER,
)


# ── offset → steps 변환 ──────────────────────────────────────

def _steps_from_offset(offset: int, set_index: int) -> int:
    """
    offset(0~44) → 총 이동 칸수 (정수).

    세트#1~20: 기준 speed 근방 45-step 격자에서 target offset에 해당하는 칸수.
    세트 외: offset 그대로 반환.
    """
    if not 0 <= offset <= 44:
        raise ValueError("offset must be in 0..44")
    if 0 <= set_index < len(_JITTER_BASE_SPEEDS):
        base_steps = int(float(_JITTER_BASE_SPEEDS[set_index]) * _JITTER_K)
        candidate = base_steps - (base_steps % 45) + offset
        if candidate - base_steps > 22:
            candidate -= 45
        elif base_steps - candidate > 22:
            candidate += 45
        return candidate
    return offset


def _derive_wheel_steps(
    base_steps: int,
    *,
    set_index: Optional[int] = None,
) -> List[int]:
    """base_steps에 휠별 추가 step을 더해 6개 독립 이동칸수를 도출."""
    if set_index is not None and set_index in PER_SET_WHEEL_STEPS:
        offsets = PER_SET_WHEEL_STEPS[set_index]
    else:
        offsets = WHEEL_OFFSET_STEPS
    return [base_steps + s for s in offsets]


# ── 단일 휠 ──────────────────────────────────────────────────

def _roll_number(start_num: int, steps: int) -> int:
    """45칸 원형 그리드에서 start_num으로부터 steps만큼 이동한 결과번호."""
    if not 1 <= start_num <= 45:
        raise ValueError("start_num must be in 1..45")
    return (start_num - 1 + steps) % 45 + 1


# ── 6휠 드로우 ───────────────────────────────────────────────

def draw_six(
    start_nums: List[int],
    base_steps: int,
    *,
    max_retries: int = MAX_DUPLICATE_RETRIES,
    wheel_steps: Optional[List[int]] = None,
) -> List[int]:
    """
    6개 시작번호로 6개 결과번호를 생성한다.

    wheel_steps: 각 휠 독립 이동칸수 (길이 6). 미제공 시 base_steps 공유.
    중복 번호 발생 시 이동량을 조정하여 재시도.
    """
    if len(start_nums) != 6:
        raise ValueError("start_nums must have length 6")
    if wheel_steps is not None and len(wheel_steps) != 6:
        raise ValueError("wheel_steps must have length 6")

    selected: List[int] = []

    for wheel_idx, start in enumerate(start_nums):
        nominal = wheel_steps[wheel_idx] if wheel_steps else base_steps
        attempts = 0
        while attempts < max_retries:
            jitter_speed = attempts * _RETRY_SPEED_JITTER * (1.0 if attempts % 2 == 0 else -1.0)
            jittered = int(nominal + jitter_speed * _JITTER_K)
            jittered = max(_MIN_STEPS, min(_MAX_STEPS, jittered))
            number = _roll_number(start, jittered)
            attempts += 1
            if number not in selected:
                selected.append(number)
                break
        else:
            raise RuntimeError(
                f"draw_six: wheel {wheel_idx} exceeded retries"
            )

    selected.sort()
    return selected
