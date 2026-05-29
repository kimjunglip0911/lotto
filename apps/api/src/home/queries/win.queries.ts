/**
 * 로또 당첨번호(lotto_winners) 테이블용 조회·저장 문장 모음입니다.
 * 홈 화면에서 회차별 당첨번호를 보거나, 사용자가 입력한 당첨번호를 저장할 때 씁니다.
 * 서비스가 회차 번호와 여섯 개 본번호·보너스 번호를 넘겨 실행합니다.
 * 해당 회차 데이터가 없으면 조회 시 "없음" 오류가, 저장 실패 시 저장 메시지가 나가지 않습니다.
 */

export const GET_WINNING_BY_NO = `
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num, winner_count, winner_amount
FROM lotto_winners
WHERE draw_no = ?
`.trim();

export const UPSERT_WINNING = `
INSERT INTO lotto_winners (draw_no, num1, num2, num3, num4, num5, num6, bonus_num)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(draw_no) DO UPDATE SET
    num1 = excluded.num1,
    num2 = excluded.num2,
    num3 = excluded.num3,
    num4 = excluded.num4,
    num5 = excluded.num5,
    num6 = excluded.num6,
    bonus_num = excluded.bonus_num
`.trim();
