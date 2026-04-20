DELETE_DRAWINGS_BY_NO_AND_METHOD = """
DELETE FROM lotto_drawings
WHERE draw_no = ? AND method = ?
""".strip()

INSERT_DRAWING = """
INSERT INTO lotto_drawings (
    group_id,
    num1,
    num2,
    num3,
    num4,
    num5,
    num6,
    bonus_num,
    draw_count,
    method,
    draw_no
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""".strip()

