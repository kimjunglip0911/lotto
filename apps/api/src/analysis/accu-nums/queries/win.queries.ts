/**
 * 누적 번호 분석에 쓰는 당첨번호(lotto_winners) 조회 문장만 모아 둡니다.
 * 회차 목록, 특정 회차, 이전 회차 범위·창(window) 조회용입니다.
 * 실행은 service/accu-nums.service.ts가 담당합니다.
 */
export const LIST_DRAW_NOS = `
SELECT draw_no
FROM lotto_winners
ORDER BY draw_no DESC
`.trim();

export const WIN_BEFORE_DRAW = `
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
FROM lotto_winners
WHERE draw_no < ?
ORDER BY draw_no ASC
`.trim();

export const WIN_BEFORE_LIMIT = `
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

export const WIN_BY_DRAW = `
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
FROM lotto_winners
WHERE draw_no = ?
LIMIT 1
`.trim();
