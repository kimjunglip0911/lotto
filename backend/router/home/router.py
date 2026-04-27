import random
from typing import Any, Callable, List, Optional

from fastapi import APIRouter, HTTPException, Query

from backend.database import get_connection
from backend.domain.models.schemas import SaveWinningRequest
from backend.sql.home import queries

router = APIRouter(tags=["drawings"])


def run_db(handler: Callable[[Any], Any], *, commit: bool = False) -> Any:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        result = handler(cursor)
        if commit:
            conn.commit()
        return result
    finally:
        conn.close()


def rows_to_dicts(rows: List[Any]) -> List[dict]:
    return [dict(row) for row in rows]


def normalize_method_name(method: Optional[str]) -> str:
    return method.replace(" (Fallback)", "") if method else "기본"


def build_recommended_drawings(rows: List[Any]) -> List[dict]:
    if not rows:
        return []

    by_method: dict[str, List[dict]] = {}
    for row in rows:
        row_dict = dict(row)
        method = normalize_method_name(row_dict.get("method"))
        by_method.setdefault(method, []).append(row_dict)

    for method_rows in by_method.values():
        random.shuffle(method_rows)

    recommended: List[dict] = []
    for method in list(by_method.keys()):
        if by_method[method]:
            recommended.append(by_method[method].pop())

    remaining_pool: List[dict] = []
    for method_rows in by_method.values():
        remaining_pool.extend(method_rows)

    if remaining_pool and len(recommended) < 10:
        sample_size = min(len(remaining_pool), 10 - len(recommended))
        recommended.extend(random.sample(remaining_pool, sample_size))

    return recommended


@router.get("/api/drawings", response_model=List[dict])
def get_drawings():
    try:
        rows = run_db(lambda cursor: cursor.execute(queries.GET_ALL_DRAWINGS).fetchall())
        return rows_to_dicts(rows)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/drawings/all")
def delete_all_drawings():
    try:
        run_db(lambda cursor: cursor.execute(queries.DELETE_ALL_DRAWINGS), commit=True)
        return {"message": "All drawings deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/drawings/draw-numbers", response_model=List[int])
def get_draw_numbers():
    try:
        rows = run_db(lambda cursor: cursor.execute(queries.GET_DISTINCT_DRAW_NOS).fetchall())
        return [row[0] for row in rows]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/drawings/recommend", response_model=List[dict])
def recommend_drawings(draw_no: Optional[int] = Query(None)):
    try:
        if draw_no:
            target_draw_no = draw_no
        else:
            latest_row = run_db(lambda cursor: cursor.execute(queries.GET_MAX_DRAW_NO).fetchone())
            target_draw_no = latest_row[0] if latest_row and latest_row[0] is not None else None

        if target_draw_no is None:
            return []

        rows = run_db(lambda cursor: cursor.execute(queries.GET_DRAWINGS_BY_NO, (target_draw_no,)).fetchall())
        return build_recommended_drawings(rows)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/drawings/by-no", response_model=List[dict])
def get_drawings_by_no(draw_no: int):
    try:
        rows = run_db(lambda cursor: cursor.execute(queries.GET_DRAWINGS_BY_NO, (draw_no,)).fetchall())
        return rows_to_dicts(rows)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/drawings/winning-by-no", response_model=dict)
def get_winning_by_no(draw_no: int):
    try:
        row = run_db(lambda cursor: cursor.execute(queries.GET_WINNING_BY_NO, (draw_no,)).fetchone())
        if not row:
            raise HTTPException(status_code=404, detail=f"No winning numbers found for draw_no={draw_no}")
        return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/drawings/save-winning", response_model=dict)
def save_winning(request: SaveWinningRequest):
    try:
        run_db(
            lambda cursor: cursor.execute(
                queries.UPSERT_WINNING,
                (
                    request.draw_no,
                    request.num1,
                    request.num2,
                    request.num3,
                    request.num4,
                    request.num5,
                    request.num6,
                    request.bonus_num,
                ),
            ),
            commit=True,
        )
        return {"message": f"{request.draw_no}회 당첨번호가 저장되었습니다."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
