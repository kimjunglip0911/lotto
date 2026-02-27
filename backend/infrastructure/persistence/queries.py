"""
SQL Query constants for the Lotto application.
"""

# Lotto Winners Queries
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

# Lotto Drawings Queries
GET_ALL_DRAWINGS = "SELECT * FROM lotto_drawings ORDER BY id DESC"
DELETE_ALL_DRAWINGS = "DELETE FROM lotto_drawings"
DELETE_DRAWINGS_BY_NO = "DELETE FROM lotto_drawings WHERE draw_no = ?"
GET_MAX_DRAW_COUNT = "SELECT MAX(draw_count) FROM lotto_drawings"
GET_DISTINCT_DRAW_NOS = "SELECT DISTINCT draw_no FROM lotto_drawings WHERE draw_no IS NOT NULL ORDER BY draw_no DESC"

INSERT_DRAWING = """
    INSERT INTO lotto_drawings 
    (group_id, num1, num2, num3, num4, num5, num6, bonus_num, draw_count, method, draw_no)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""

# Database Initialization Queries
CREATE_WINNERS_TABLE = """
    CREATE TABLE IF NOT EXISTS lotto_winners (
        draw_no INTEGER PRIMARY KEY,
        num1 INTEGER NOT NULL,
        num2 INTEGER NOT NULL,
        num3 INTEGER NOT NULL,
        num4 INTEGER NOT NULL,
        num5 INTEGER NOT NULL,
        num6 INTEGER NOT NULL,
        bonus_num INTEGER NOT NULL,
        winner_count INTEGER,
        winner_amount INTEGER
    )
"""

CREATE_DRAWINGS_TABLE = """
    CREATE TABLE IF NOT EXISTS lotto_drawings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id TEXT NOT NULL,
        num1 INTEGER NOT NULL,
        num2 INTEGER NOT NULL,
        num3 INTEGER NOT NULL,
        num4 INTEGER NOT NULL,
        num5 INTEGER NOT NULL,
        num6 INTEGER NOT NULL,
        bonus_num INTEGER NOT NULL,
        draw_count INTEGER NOT NULL,
        method TEXT,
        draw_no INTEGER
    )
"""
