# -*- coding: utf-8 -*-
"""
JL 휠 시뮬레이션 — 시작번호.

시작번호는 항상 직전 회차 당첨 본번호 6개.
20세트 간 다양화는 START_PERMUTATIONS 순열로 배치 순서를 달리 한다.
"""
from __future__ import annotations

from collections import Counter
from typing import List, Optional, Tuple

from backend.database import get_connection

SQL_WINNER_MAIN_NUMBERS_UP_TO_DRAW = """
SELECT num1, num2, num3, num4, num5, num6
FROM lotto_winners
WHERE draw_no <= ?
""".strip()

SQL_WINNER_TOP7_BY_DRAW = """
SELECT num1, num2, num3, num4, num5, num6, bonus_num
FROM lotto_winners
WHERE draw_no = ?
""".strip()


# ── 세트별 시작번호 순열 (6개 번호의 배치 순서) ───────────────
# 인덱스 0~5는 정렬된 시작번호[0]~[5]에 대응.
# 각 세트마다 다른 순열을 적용하여 6개 휠에 매핑되는 번호를 달리 한다.
# 튜닝: 이 리스트를 수정하면 세트별 결과가 변경된다.
START_PERMUTATIONS: List[Tuple[int, ...]] = [
    (0, 1, 2, 3, 4, 5),  # #1  원본
    (1, 2, 3, 4, 5, 0),  # #2  회전 1
    (2, 3, 4, 5, 0, 1),  # #3  회전 2
    (3, 4, 5, 0, 1, 2),  # #4  회전 3
    (4, 5, 0, 1, 2, 3),  # #5  회전 4
    (5, 0, 1, 2, 3, 4),  # #6  회전 5
    (5, 4, 3, 2, 1, 0),  # #7  역순
    (0, 5, 4, 3, 2, 1),  # #8  역회전 1
    (1, 0, 5, 4, 3, 2),  # #9  역회전 2
    (2, 1, 0, 5, 4, 3),  # #10 역회전 3
    (3, 2, 1, 0, 5, 4),  # #11 역회전 4
    (4, 3, 2, 1, 0, 5),  # #12 역회전 5
    (0, 2, 4, 1, 3, 5),  # #13 교차 1
    (1, 3, 5, 0, 2, 4),  # #14 교차 2
    (2, 4, 0, 3, 5, 1),  # #15 교차 3
    (3, 5, 1, 4, 0, 2),  # #16 교차 4
    (4, 0, 2, 5, 1, 3),  # #17 교차 5
    (5, 1, 3, 2, 4, 0),  # #18 교차 6
    (0, 3, 1, 5, 2, 4),  # #19 혼합 1
    (4, 2, 5, 0, 3, 1),  # #20 혼합 2
]


# ── 빈도 카운터 (교정·중복 교체에서 사용) ────────────────────

def _get_number_frequency_counter(up_to_draw_inclusive: int) -> Counter[int]:
    """1~up_to_draw_inclusive 본번호(num1~6) 기준 번호별 누적 빈도."""
    if up_to_draw_inclusive < 1:
        return Counter()
    conn = get_connection()
    conn.row_factory = None
    cur = conn.cursor()
    cur.execute(SQL_WINNER_MAIN_NUMBERS_UP_TO_DRAW, (up_to_draw_inclusive,))
    freq: Counter[int] = Counter()
    for row in cur.fetchall():
        for n in row:
            if isinstance(n, int) and 1 <= n <= 45:
                freq[n] += 1
    conn.close()
    return freq


# ── DB 조회 헬퍼 ─────────────────────────────────────────────

def _fetch_winner_for_draw(draw_no: int) -> Optional[Tuple[set[int], int]]:
    """특정 회차의 당첨번호(본번호 set, 보너스)를 반환."""
    conn = get_connection()
    conn.row_factory = None
    cur = conn.cursor()
    cur.execute(SQL_WINNER_TOP7_BY_DRAW, (draw_no,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return None
    main = {int(row[0]), int(row[1]), int(row[2]), int(row[3]), int(row[4]), int(row[5])}
    bonus = int(row[6] or 0)
    return main, bonus


# ── 시작번호 ─────────────────────────────────────────────────

def get_previous_draw_winning_starts(draw_no: int) -> List[int]:
    """
    직전 회차(draw_no-1) 당첨 본번호 6개를 오름차순으로 반환.
    draw_no <= 1이거나 데이터가 없으면 [1, 2, 3, 4, 5, 6] 반환.
    """
    if draw_no <= 1:
        return [1, 2, 3, 4, 5, 6]
    prev = _fetch_winner_for_draw(draw_no - 1)
    if prev is None:
        return [1, 2, 3, 4, 5, 6]
    main, _ = prev
    return sorted(int(x) for x in main)


def get_previous_draw_top7(draw_no: int) -> Optional[List[int]]:
    """
    직전 회차(draw_no-1) 기준 본번호 6개(오름차순) + 보너스 1개, 총 7개.

    인덱스 0~5: 정렬된 본번호, 인덱스 6: 보너스. 데이터 없거나 보너스가 본번호와
    겹치면 None (레거시 6시작 경로로 폴백).
    """
    if draw_no <= 1:
        return None
    prev = _fetch_winner_for_draw(draw_no - 1)
    if prev is None:
        return None
    main, bonus = prev
    sm = sorted(int(x) for x in main)
    b = int(bonus)
    if not 1 <= b <= 45 or b in sm:
        return None
    return sm + [b]
