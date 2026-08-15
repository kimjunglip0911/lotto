/**
 * 조합 분석 집계 저장 테이블용 SQL.
 */
export const DELETE_ALL_BANDS = `DELETE FROM combo_pos_bands`.trim();

export const SELECT_ALL_BANDS = `
SELECT position, band_label, draw_count, percentage, total_draws, updated_at
FROM combo_pos_bands
ORDER BY position ASC, band_label ASC
`.trim();

export const INSERT_BAND = `
INSERT INTO combo_pos_bands (
    position, band_label, draw_count, percentage, total_draws, updated_at
)
VALUES ($1, $2, $3, $4, $5, NOW())
`.trim();
