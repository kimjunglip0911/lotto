import importlib.util
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException, Query

from backend.database import get_connection

router = APIRouter(tags=["analysis"])


def _load_queries_module():
    queries_path = (
        Path(__file__).resolve().parents[3]
        / "sql"
        / "analysis"
        / "absence-streak"
        / "queries.py"
    )
    spec = importlib.util.spec_from_file_location(
        "backend.sql.analysis.absence_streak.queries",
        queries_path,
    )
    if spec is None or spec.loader is None:
        raise ImportError(f"Failed to load SQL queries module from {queries_path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


queries = _load_queries_module()


@router.get("/api/analysis/absence-streak/draw-numbers", response_model=List[int])
def get_draw_numbers():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.GET_AVAILABLE_DRAW_NOS)
        rows = cursor.fetchall()
        conn.close()
        return [row[0] for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/analysis/absence-streak/winning-number", response_model=dict)
def get_winning_number(draw_no: int = Query(..., ge=1, description="선택 회차")):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.GET_WINNING_NUMBERS_BY_DRAW, (draw_no,))
        row = cursor.fetchone()
        conn.close()

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

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.GET_WINNING_NUMBERS_BEFORE_DRAW, (draw_no,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
