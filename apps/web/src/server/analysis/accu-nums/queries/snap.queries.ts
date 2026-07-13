/**
 * 누적 분석 결과(4개 번호) 스냅샷 테이블용 저장·조회 문장입니다.
 */
export const UPSERT_SNAP = `
INSERT INTO accumulated_number_snapshots (
    anchor_draw_no, schema_version, final_num1, final_num2, final_num3, final_num4, updated_at
)
VALUES ($1, $2, $3, $4, $5, $6, NOW())
ON CONFLICT (anchor_draw_no) DO UPDATE SET
    schema_version = EXCLUDED.schema_version,
    final_num1 = EXCLUDED.final_num1,
    final_num2 = EXCLUDED.final_num2,
    final_num3 = EXCLUDED.final_num3,
    final_num4 = EXCLUDED.final_num4,
    updated_at = NOW()
`.trim();

export const SNAP_BY_DRAW = `
SELECT anchor_draw_no, schema_version, final_num1, final_num2, final_num3, final_num4, updated_at
FROM accumulated_number_snapshots
WHERE anchor_draw_no = $1
LIMIT 1
`.trim();
