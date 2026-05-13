from typing import List

from fastapi import APIRouter, Query

from backend.router.analysis._shared import (
    fetch_dict_or_404,
    fetch_dict_rows,
    fetch_draw_numbers,
    load_queries_module,
)

router = APIRouter(tags=["analysis"])
QUERIES_MODULE_NAME = "backend.router.analysis.run_streak.queries"
QUERIES_RELATIVE_PATH = ("router", "analysis", "run-streak", "queries.py")
NOT_FOUND_DETAIL = "선택한 회차의 당첨번호를 찾을 수 없습니다."


def _load_queries_module():
    return load_queries_module(
        QUERIES_MODULE_NAME,
        QUERIES_RELATIVE_PATH,
    )


queries = _load_queries_module()


@router.get("/api/analysis/run-streak/draw-numbers", response_model=List[int])
def get_draw_numbers():
    return fetch_draw_numbers(queries.GET_AVAILABLE_DRAW_NOS)


@router.get("/api/analysis/run-streak/winning-number", response_model=dict)
def get_winning_number(draw_no: int = Query(..., ge=1, description="선택 회차")):
    return fetch_dict_or_404(
        queries.GET_WINNING_NUMBERS_BY_DRAW,
        (draw_no,),
        NOT_FOUND_DETAIL,
    )


@router.get("/api/analysis/run-streak/winning-numbers-range", response_model=List[dict])
def get_winning_numbers_range(draw_no: int = Query(..., ge=1, description="선택 회차")):
    if draw_no <= 1:
        return []
    return fetch_dict_rows(queries.GET_WINNING_NUMBERS_BEFORE_DRAW, (draw_no,))
