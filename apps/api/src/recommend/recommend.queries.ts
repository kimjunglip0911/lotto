export const DELETE_DRAWINGS_BY_NO_AND_METHOD = `
DELETE FROM lotto_drawings
WHERE draw_no = $1 AND method = $2
`.trim();

export const GET_DRAWINGS_BY_DRAW_NO_AND_METHOD = `
SELECT num1, num2, num3, num4, num5, num6, method, strategy
FROM lotto_drawings
WHERE draw_no = $1 AND method = $2
ORDER BY id ASC
`.trim();

export const GET_MAX_WINNER_DRAW_NO =
  `SELECT MAX(draw_no) AS max_draw_no FROM lotto_winners`.trim();

export const GET_WINNING_NUMBERS_BEFORE_DRAW = `
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
FROM lotto_winners
WHERE draw_no < $1
ORDER BY draw_no ASC
`.trim();

export const GET_WINNING_NUMBERS_BEFORE_DRAW_LIMITED = `
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
FROM (
    SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
    FROM lotto_winners
    WHERE draw_no < $1
    ORDER BY draw_no DESC
    LIMIT $2
) AS recent
ORDER BY draw_no ASC
`.trim();

export const INSERT_DRAWING = `
INSERT INTO lotto_drawings (
    group_id, num1, num2, num3, num4, num5, num6,
    bonus_num, draw_count, method, draw_no, strategy
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
`.trim();
