import importlib.util
from pathlib import Path
from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException, Query

from backend.database import get_connection

router = APIRouter(tags=["analysis"])
QUERIES_MODULE_NAME = "backend.sql.analysis.absence_streak.queries"
QUERIES_RELATIVE_PATH = ("sql", "analysis", "absence-streak", "queries.py")


def _load_queries_module():
    queries_path = Path(__file__).resolve().parents[3].joinpath(*QUERIES_RELATIVE_PATH)
    spec = importlib.util.spec_from_file_location(
        QUERIES_MODULE_NAME,
        queries_path,
    )
    if spec is None or spec.loader is None:
        raise ImportError(f"Failed to load SQL queries module from {queries_path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


queries = _load_queries_module()


def _execute_query(sql: str, params: tuple[Any, ...] = ()) -> List[Any]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        return cursor.fetchall()
    finally:
        conn.close()


def _execute_single_query(sql: str, params: tuple[Any, ...] = ()) -> Optional[Any]:
    rows = _execute_query(sql, params)
    return rows[0] if rows else None


@router.get("/api/analysis/absence-streak/draw-numbers", response_model=List[int])
def get_draw_numbers():
    try:
        rows = _execute_query(queries.GET_AVAILABLE_DRAW_NOS)
        return [row[0] for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/analysis/absence-streak/winning-number", response_model=dict)
def get_winning_number(draw_no: int = Query(..., ge=1, description="선택 회차")):
    try:
        row = _execute_single_query(queries.GET_WINNING_NUMBERS_BY_DRAW, (draw_no,))

        if row is None:
            raise HTTPException(status_code=404, detail="선택한 회차의 당첨번호를 찾을 수 없습니다.")

        return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/analysis/absence-streak/winning-numbers-range", response_model=List[dict])
def get_winning_numbers_range(draw_no: int = Query(..., ge=1, description="선택 회차")):
    try:
        if draw_no <= 1:
            return []

        rows = _execute_query(queries.GET_WINNING_NUMBERS_BEFORE_DRAW, (draw_no,))
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
