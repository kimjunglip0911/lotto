-- 로또 당첨 번호 테이블
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
);

-- 로또 추첨 번호 리스트 테이블
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
);
