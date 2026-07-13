/**
 * 로또 당첨번호(lotto_winners) 테이블용 조회·저장 문장 모음입니다.
 */
export const GET_WINNING_BY_NO = `
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num, winner_count, winner_amount
FROM lotto_winners
WHERE draw_no = $1
`.trim();

export const UPSERT_WINNING = `
INSERT INTO lotto_winners (draw_no, num1, num2, num3, num4, num5, num6, bonus_num)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (draw_no) DO UPDATE SET
    num1 = EXCLUDED.num1,
    num2 = EXCLUDED.num2,
    num3 = EXCLUDED.num3,
    num4 = EXCLUDED.num4,
    num5 = EXCLUDED.num5,
    num6 = EXCLUDED.num6,
    bonus_num = EXCLUDED.bonus_num
`.trim();
