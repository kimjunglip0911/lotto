GET_ALL_DRAWINGS = "SELECT * FROM lotto_drawings ORDER BY id DESC"
DELETE_ALL_DRAWINGS = "DELETE FROM lotto_drawings"
GET_DRAWINGS_BY_NO = "SELECT * FROM lotto_drawings WHERE draw_no = ?"
GET_WINNING_BY_NO = "SELECT * FROM lotto_winners WHERE draw_no = ?"
GET_DISTINCT_DRAW_NOS = """
    SELECT DISTINCT draw_no FROM (
        SELECT draw_no FROM lotto_winners WHERE draw_no IS NOT NULL
        UNION
        SELECT draw_no FROM lotto_drawings WHERE draw_no IS NOT NULL
    ) ORDER BY draw_no DESC
"""

