/**
 * 조합 집계 재계산용 당첨 전체 조회.
 */
export const LIST_ALL_WINNERS = `
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
FROM lotto_winners
ORDER BY draw_no ASC
`.trim();
