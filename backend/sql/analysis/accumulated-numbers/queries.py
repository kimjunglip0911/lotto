GET_AVAILABLE_DRAW_NOS = """
SELECT draw_no
FROM lotto_winners
ORDER BY draw_no DESC
""".strip()

GET_WINNING_NUMBERS_BEFORE_DRAW = """
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
FROM lotto_winners
WHERE draw_no < ?
ORDER BY draw_no ASC
""".strip()

GET_WINNING_NUMBERS_BY_DRAW = """
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
FROM lotto_winners
WHERE draw_no = ?
LIMIT 1
""".strip()
