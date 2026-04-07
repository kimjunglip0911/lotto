# -*- coding: utf-8 -*-
"""
로또 6/45 등수 판정 (당첨 본번호 6개 + 보너스 1개 기준).
"""
from __future__ import annotations

from typing import Optional, Set


def rank_lotto_ticket(
    winning_main: Set[int],
    bonus: int,
    ticket: Set[int],
) -> Optional[int]:
    """
    세트 ``ticket`` 의 등수를 반환합니다.

    - 1등: 본번호 6개 일치
    - 2등: 본번호 5개 + 보너스
    - 3등: 본번호 5개
    - 4등: 본번호 4개
    - 5등: 본번호 3개
    - 그 외: ``None``
    """
    if len(winning_main) != 6 or len(ticket) != 6:
        raise ValueError("winning_main 과 ticket 은 각각 서로 다른 정수 6개여야 합니다.")
    matched = len(winning_main & ticket)
    has_bonus = bonus in ticket

    if matched == 6:
        return 1
    if matched == 5 and has_bonus:
        return 2
    if matched == 5:
        return 3
    if matched == 4:
        return 4
    if matched == 3:
        return 5
    return None
