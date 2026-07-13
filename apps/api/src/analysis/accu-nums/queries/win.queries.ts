/**
 * 누적 번호 분석에 쓰는 당첨번호(lotto_winners) 조회 문장만 모아 둡니다.
 */
export const LIST_DRAW_NOS = `
SELECT draw_no
FROM lotto_winners
ORDER BY draw_no DESC
`.trim();

export const WIN_BEFORE_DRAW = `
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
FROM lotto_winners
WHERE draw_no < $1
ORDER BY draw_no ASC
`.trim();

export const WIN_BEFORE_LIMIT = `
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

export const WIN_BY_DRAW = `
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
FROM lotto_winners
WHERE draw_no = $1
LIMIT 1
`.trim();
