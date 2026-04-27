from typing import List

from fastapi import APIRouter, HTTPException, Query

from backend.router.analysis._shared import (
    fetch_all,
    fetch_one,
    load_queries_module,
    raise_as_http_500,
)

router = APIRouter(tags=["analysis"])


def _load_queries_module():
    return load_queries_module(
        "backend.sql.analysis.accumulated_numbers.queries",
        ("sql", "analysis", "accumulated-numbers", "queries.py"),
    )


queries = _load_queries_module()
ALLOWED_WINDOW_SIZES = {4, 12, 26, 52, 156, 260, 520}


@router.get("/api/analysis/accumulated-numbers/draw-numbers", response_model=List[int])
def get_draw_numbers():
    try:
        rows = fetch_all(queries.GET_AVAILABLE_DRAW_NOS)
        return [row[0] for row in rows]
    except Exception as e:
        raise_as_http_500(e)


@router.get("/api/analysis/accumulated-numbers/winning-numbers-range", response_model=List[dict])
def get_winning_numbers_range(draw_no: int = Query(..., ge=1, description="선택 회차")):
    try:
        if draw_no <= 1:
            return []
        rows = fetch_all(queries.GET_WINNING_NUMBERS_BEFORE_DRAW, (draw_no,))
        return [dict(row) for row in rows]
    except Exception as e:
        raise_as_http_500(e)


@router.get("/api/analysis/accumulated-numbers/winning-number", response_model=dict)
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


@router.get("/api/analysis/accumulated-numbers/winning-numbers-window", response_model=List[dict])
def get_winning_numbers_window(
    draw_no: int = Query(..., ge=1, description="선택 회차"),
    window_size: int = Query(..., description="이전 회차 개수 (허용값: 4, 12, 26, 52, 156, 260, 520)"),
):
    try:
        if draw_no <= 1:
            return []
        if window_size not in ALLOWED_WINDOW_SIZES:
            raise HTTPException(
                status_code=400,
                detail="window_size는 4, 12, 26, 52, 156, 260, 520만 허용됩니다.",
            )

        rows = fetch_all(queries.GET_WINNING_NUMBERS_BEFORE_DRAW_LIMITED, (draw_no, window_size))
        return [dict(row) for row in rows]
    except HTTPException:
        raise
    except Exception as e:
        raise_as_http_500(e)
