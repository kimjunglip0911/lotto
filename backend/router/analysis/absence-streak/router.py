from typing import List

from fastapi import APIRouter, HTTPException, Query

from backend.router.analysis._shared import (
    fetch_all,
    fetch_one,
    load_queries_module,
    raise_as_http_500,
)

router = APIRouter(tags=["analysis"])
QUERIES_MODULE_NAME = "backend.sql.analysis.absence_streak.queries"
QUERIES_RELATIVE_PATH = ("sql", "analysis", "absence-streak", "queries.py")


def _load_queries_module():
    return load_queries_module(
        QUERIES_MODULE_NAME,
        QUERIES_RELATIVE_PATH,
    )


queries = _load_queries_module()


@router.get("/api/analysis/absence-streak/draw-numbers", response_model=List[int])
def get_draw_numbers():
    try:
        rows = fetch_all(queries.GET_AVAILABLE_DRAW_NOS)
        return [row[0] for row in rows]
    except Exception as e:
        raise_as_http_500(e)


@router.get("/api/analysis/absence-streak/winning-number", response_model=dict)
def get_winning_number(draw_no: int = Query(..., ge=1, description="선택 회차")):
    try:
        row = fetch_one(queries.GET_WINNING_NUMBERS_BY_DRAW, (draw_no,))

        if row is None:
            raise HTTPException(status_code=404, detail="선택한 회차의 당첨번호를 찾을 수 없습니다.")

        return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        raise_as_http_500(e)


@router.get("/api/analysis/absence-streak/winning-numbers-range", response_model=List[dict])
def get_winning_numbers_range(draw_no: int = Query(..., ge=1, description="선택 회차")):
    try:
        if draw_no <= 1:
            return []

        rows = fetch_all(queries.GET_WINNING_NUMBERS_BEFORE_DRAW, (draw_no,))
        return [dict(row) for row in rows]
    except Exception as e:
        raise_as_http_500(e)
