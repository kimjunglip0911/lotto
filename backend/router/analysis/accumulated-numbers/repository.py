# 누적번호 분석 스냅샷 DB 접근

from typing import Any

from backend.DB.database import get_connection
from backend.router.analysis._shared import load_queries_module

_QUERIES = load_queries_module(
    "backend.router.analysis.accumulated_numbers.queries",
    ("router", "analysis", "accumulated-numbers", "queries.py"),
)


def save_snapshot(
    anchor_draw_no: int,
    schema_version: int,
    final_num1: int,
    final_num2: int,
    final_num3: int,
    final_num4: int,
) -> None:
    conn = get_connection()
    try:
        conn.execute(
            _QUERIES.UPSERT_ACCUMULATED_SNAPSHOT,
            (anchor_draw_no, schema_version, final_num1, final_num2, final_num3, final_num4),
        )
        conn.commit()
    finally:
        conn.close()


def get_snapshot_row(anchor_draw_no: int) -> dict[str, Any] | None:
    conn = get_connection()
    try:
        row = conn.execute(
            _QUERIES.GET_ACCUMULATED_SNAPSHOT_BY_DRAW,
            (anchor_draw_no,),
        ).fetchone()
        return dict(row) if row is not None else None
    finally:
        conn.close()
