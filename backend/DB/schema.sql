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

-- 누적번호 분석: 기준 회차별 최종 채택 4개 번호만 저장(회차당 최신 1건 UPSERT)
CREATE TABLE IF NOT EXISTS accumulated_number_snapshots (
    anchor_draw_no INTEGER PRIMARY KEY,
    schema_version INTEGER NOT NULL,
    final_num1 INTEGER NOT NULL,
    final_num2 INTEGER NOT NULL,
    final_num3 INTEGER NOT NULL,
    final_num4 INTEGER NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
