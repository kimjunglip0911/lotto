/**
 * 카이제곱 검정 분석 화면이 쓰는 당첨번호(lotto_winners) 조회 문장만 모아 둡니다.
 * 저장된 회차 목록, 특정 회차 한 건, 선택 회차 이전 전체 이력 조회용입니다.
 * 실제 실행·조건 처리는 service/chi.service.ts가 담당합니다.
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

export const WIN_BY_DRAW = `
SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
FROM lotto_winners
WHERE draw_no = ?
LIMIT 1
`.trim();
