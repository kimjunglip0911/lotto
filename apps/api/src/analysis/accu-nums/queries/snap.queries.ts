/**
 * 누적 분석 결과(4개 번호) 스냅샷 테이블용 저장·조회 문장입니다.
 * accumulated_number_snapshots에 회차별로 넣거나 읽을 때 씁니다.
 * 실행은 repository/snapshot.repository.ts가 담당합니다.
 */
export const UPSERT_SNAP = `
INSERT INTO accumulated_number_snapshots (
    anchor_draw_no, schema_version, final_num1, final_num2, final_num3, final_num4, updated_at
)
VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
ON CONFLICT(anchor_draw_no) DO UPDATE SET
    schema_version = excluded.schema_version,
    final_num1 = excluded.final_num1,
    final_num2 = excluded.final_num2,
    final_num3 = excluded.final_num3,
    final_num4 = excluded.final_num4,
    updated_at = datetime('now')
`.trim();

export const SNAP_BY_DRAW = `
SELECT anchor_draw_no, schema_version, final_num1, final_num2, final_num3, final_num4, updated_at
FROM accumulated_number_snapshots
WHERE anchor_draw_no = ?
LIMIT 1
`.trim();
