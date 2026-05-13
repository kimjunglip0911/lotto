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

GET_WINNING_NUMBERS_BEFORE_DRAW_LIMITED = """
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
FROM (
    SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
    FROM lotto_winners
    WHERE draw_no < ?
    ORDER BY draw_no DESC
    LIMIT ?
)
ORDER BY draw_no ASC
""".strip()

GET_WINNING_NUMBERS_BY_DRAW = """
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
FROM lotto_winners
WHERE draw_no = ?
LIMIT 1
""".strip()

UPSERT_ACCUMULATED_SNAPSHOT = """
INSERT INTO accumulated_number_snapshots (
    anchor_draw_no, schema_version, final_num1, final_num2, final_num3, final_num4, updated_at
)
VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
ON CONFLICT(anchor_draw_no) DO UPDATE SET
    schema_version = excluded.schema_version,
    final_num1 = excluded.final_num1,
    final_num2 = excluded.final_num2,
    final_num3 = excluded.final_num3,
    final_num4 = excluded.final_num4,
    updated_at = datetime('now')
""".strip()

GET_ACCUMULATED_SNAPSHOT_BY_DRAW = """
SELECT anchor_draw_no, schema_version, final_num1, final_num2, final_num3, final_num4, updated_at
FROM accumulated_number_snapshots
WHERE anchor_draw_no = ?
LIMIT 1
""".strip()
