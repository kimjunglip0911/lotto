import random
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from backend.database import get_connection
from backend.domain.models.schemas import SaveWinningRequest
from backend.sql.home import queries

router = APIRouter(tags=["drawings"])


@router.get("/api/drawings", response_model=List[dict])
def get_drawings():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.GET_ALL_DRAWINGS)
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/drawings/all")
def delete_all_drawings():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.DELETE_ALL_DRAWINGS)
        conn.commit()
        conn.close()
        return {"message": "All drawings deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/drawings/draw-numbers", response_model=List[int])
def get_draw_numbers():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.GET_DISTINCT_DRAW_NOS)
        rows = cursor.fetchall()
        conn.close()
        return [row[0] for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/drawings/recommend", response_model=List[dict])
def recommend_drawings(draw_no: Optional[int] = Query(None)):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        if draw_no:
            target_draw_no = draw_no
        else:
            cursor.execute(queries.GET_MAX_DRAW_NO)
            latest_row = cursor.fetchone()
            target_draw_no = latest_row[0] if latest_row and latest_row[0] is not None else None

        if target_draw_no is None:
            conn.close()
            return []

        cursor.execute(queries.GET_DRAWINGS_BY_NO, (target_draw_no,))
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return []

        by_method = {}
        for row in rows:
            row_dict = dict(row)
            method = row_dict["method"]
            base_m = method.replace(" (Fallback)", "") if method else "기본"
            if base_m not in by_method:
                by_method[base_m] = []
            by_method[base_m].append(row_dict)

        for method in by_method:
            random.shuffle(by_method[method])

        recommended = []
        methods = list(by_method.keys())

        for method in methods:
            if by_method[method]:
                recommended.append(by_method[method].pop())

        remaining_pool = []
        for method in by_method:
            remaining_pool.extend(by_method[method])

        if remaining_pool and len(recommended) < 10:
            sample_size = min(len(remaining_pool), 10 - len(recommended))
            recommended.extend(random.sample(remaining_pool, sample_size))

        return recommended
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/drawings/by-no", response_model=List[dict])
def get_drawings_by_no(draw_no: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.GET_DRAWINGS_BY_NO, (draw_no,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/drawings/winning-by-no", response_model=dict)
def get_winning_by_no(draw_no: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.GET_WINNING_BY_NO, (draw_no,))
        row = cursor.fetchone()
        conn.close()
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
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
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
        )
        conn.commit()
        conn.close()
        return {"message": f"{request.draw_no}회 당첨번호가 저장되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
