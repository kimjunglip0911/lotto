# -*- coding: utf-8 -*-
"""lotto_rank 단위 테스트."""

from features.analysis.domain.lotto_rank import rank_lotto_ticket


def test_rank_lotto_ticket_tiers() -> None:
    main = {1, 2, 3, 4, 5, 6}
    bonus = 7
    assert rank_lotto_ticket(main, bonus, {1, 2, 3, 4, 5, 6}) == 1
    assert rank_lotto_ticket(main, bonus, {1, 2, 3, 4, 5, 7}) == 2
    assert rank_lotto_ticket(main, bonus, {1, 2, 3, 4, 5, 8}) == 3
    assert rank_lotto_ticket(main, bonus, {1, 2, 3, 4, 8, 9}) == 4
    assert rank_lotto_ticket(main, bonus, {1, 2, 3, 8, 9, 10}) == 5
    assert rank_lotto_ticket(main, bonus, {1, 2, 8, 9, 10, 11}) is None
