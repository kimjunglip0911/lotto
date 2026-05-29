/**
 * 로또 추첨 번호(lotto_drawings) 테이블용 조회·삭제 문장 모음입니다.
 * 홈 화면의 번호 목록, 회차별 조회, 회차 선택 목록, 전체 삭제에 쓰입니다.
 * 서비스가 이 문장을 실행하고, 결과는 화면에 번호 세트·회차 목록으로 보입니다.
 * 문장이 잘못되면 목록이 비거나 오류 메시지가 나갑니다.
 */

export const GET_ALL_DRAWINGS = `
SELECT id, group_id, num1, num2, num3, num4, num5, num6, bonus_num, draw_count, method, draw_no
FROM lotto_drawings
ORDER BY id DESC
`.trim();

export const DELETE_ALL_DRAWINGS = `DELETE FROM lotto_drawings`.trim();

export const GET_DRAWINGS_BY_NO = `
SELECT id, group_id, num1, num2, num3, num4, num5, num6, bonus_num, draw_count, method, draw_no
FROM lotto_drawings
WHERE draw_no = ?
ORDER BY id DESC
`.trim();

export const GET_DISTINCT_DRAW_NOS = `
SELECT DISTINCT draw_no
FROM lotto_drawings
WHERE draw_no IS NOT NULL
ORDER BY draw_no DESC
`.trim();
