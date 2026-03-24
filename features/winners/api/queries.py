GET_ALL_WINNERS = "SELECT * FROM lotto_winners ORDER BY draw_no DESC"
GET_LATEST_DRAW_NO = "SELECT MAX(draw_no) FROM lotto_winners"
INSERT_OR_REPLACE_WINNER = """
    INSERT OR REPLACE INTO lotto_winners
    (draw_no, num1, num2, num3, num4, num5, num6, bonus_num, winner_count, winner_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""
DELETE_WINNER = "DELETE FROM lotto_winners WHERE draw_no = ?"
UPDATE_WINNER_STATS = """
    UPDATE lotto_winners
    SET winner_count = ?, winner_amount = ?
    WHERE draw_no = ?
"""

