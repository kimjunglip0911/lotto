export const DELETE_DRAWINGS_BY_NO_AND_METHOD = `
DELETE FROM lotto_drawings
WHERE draw_no = ? AND method = ?
`.trim();

export const GET_DRAWINGS_BY_DRAW_NO_AND_METHOD = `
SELECT num1, num2, num3, num4, num5, num6, method, strategy
FROM lotto_drawings
WHERE draw_no = ? AND method = ?
ORDER BY rowid ASC
`.trim();

export const GET_MAX_WINNER_DRAW_NO =
  `SELECT MAX(draw_no) FROM lotto_winners`.trim();

export const GET_WINNING_NUMBERS_BEFORE_DRAW = `
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
FROM lotto_winners
WHERE draw_no < ?
ORDER BY draw_no ASC
`.trim();

export const GET_WINNING_NUMBERS_BEFORE_DRAW_LIMITED = `
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
FROM (
    SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
    FROM lotto_winners
    WHERE draw_no < ?
    ORDER BY draw_no DESC
    LIMIT ?
)
ORDER BY draw_no ASC
`.trim();

export const INSERT_DRAWING = `
INSERT INTO lotto_drawings (
    group_id, num1, num2, num3, num4, num5, num6,
    bonus_num, draw_count, method, draw_no, strategy
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`.trim();
