from typing import List

from fastapi import APIRouter, HTTPException, Query

from backend.router.analysis._shared import (
    fetch_dict_or_404,
    fetch_dict_rows,
    fetch_draw_numbers,
    load_queries_module,
)

router = APIRouter(tags=["analysis"])
QUERIES_MODULE_NAME = "backend.sql.analysis.accumulated_numbers.queries"
QUERIES_RELATIVE_PATH = ("sql", "analysis", "accumulated-numbers", "queries.py")
NOT_FOUND_DETAIL = "선택한 회차의 당첨번호를 찾을 수 없습니다."


def _load_queries_module():
    return load_queries_module(
        QUERIES_MODULE_NAME,
        QUERIES_RELATIVE_PATH,
    )


queries = _load_queries_module()
ALLOWED_WINDOW_SIZES = {4, 12, 26, 52, 156, 260, 520}


@router.get("/api/analysis/accumulated-numbers/draw-numbers", response_model=List[int])
def get_draw_numbers():
    return fetch_draw_numbers(queries.GET_AVAILABLE_DRAW_NOS)


@router.get("/api/analysis/accumulated-numbers/winning-numbers-range", response_model=List[dict])
def get_winning_numbers_range(draw_no: int = Query(..., ge=1, description="선택 회차")):
    if draw_no <= 1:
        return []
    return fetch_dict_rows(queries.GET_WINNING_NUMBERS_BEFORE_DRAW, (draw_no,))


@router.get("/api/analysis/accumulated-numbers/winning-number", response_model=dict)
def get_winning_number(draw_no: int = Query(..., ge=1, description="선택 회차")):
    return fetch_dict_or_404(
        queries.GET_WINNING_NUMBERS_BY_DRAW,
        (draw_no,),
        NOT_FOUND_DETAIL,
    )


@router.get("/api/analysis/accumulated-numbers/winning-numbers-window", response_model=List[dict])
def get_winning_numbers_window(
    draw_no: int = Query(..., ge=1, description="선택 회차"),
    window_size: int = Query(..., description="이전 회차 개수 (허용값: 4, 12, 26, 52, 156, 260, 520)"),
):
    if draw_no <= 1:
        return []
    if window_size not in ALLOWED_WINDOW_SIZES:
        raise HTTPException(
            status_code=400,
            detail="window_size는 4, 12, 26, 52, 156, 260, 520만 허용됩니다.",
        )

    return fetch_dict_rows(queries.GET_WINNING_NUMBERS_BEFORE_DRAW_LIMITED, (draw_no, window_size))
