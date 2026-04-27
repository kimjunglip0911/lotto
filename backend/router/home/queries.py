GET_ALL_DRAWINGS = """
SELECT id, group_id, num1, num2, num3, num4, num5, num6, bonus_num, draw_count, method, draw_no
FROM lotto_drawings
ORDER BY id DESC
""".strip()

DELETE_ALL_DRAWINGS = """
DELETE FROM lotto_drawings
""".strip()

GET_DRAWINGS_BY_NO = """
SELECT id, group_id, num1, num2, num3, num4, num5, num6, bonus_num, draw_count, method, draw_no
FROM lotto_drawings
WHERE draw_no = ?
ORDER BY id DESC
""".strip()

GET_WINNING_BY_NO = """
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num, winner_count, winner_amount
FROM lotto_winners
WHERE draw_no = ?
""".strip()

GET_DISTINCT_DRAW_NOS = """
SELECT DISTINCT draw_no
FROM lotto_drawings
WHERE draw_no IS NOT NULL
ORDER BY draw_no DESC
""".strip()

UPSERT_WINNING = """
INSERT INTO lotto_winners (draw_no, num1, num2, num3, num4, num5, num6, bonus_num)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(draw_no) DO UPDATE SET
    num1 = excluded.num1,
    num2 = excluded.num2,
    num3 = excluded.num3,
    num4 = excluded.num4,
    num5 = excluded.num5,
    num6 = excluded.num6,
    bonus_num = excluded.bonus_num
""".strip()

GET_MAX_DRAW_NO = """
SELECT MAX(draw_no)
FROM lotto_drawings
""".strip()
