import random
import uuid
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from domain.models.schemas import GenerateSaveRequest
from domain.services.analysis.jl_service import (
    analyze_draw_duplicate_sets,
    generate_jl_wheel_sets,
    generate_wheel_sets,
)
from domain.services.generator_service import generate_random_sets
from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries

router = APIRouter(tags=["drawings_and_analysis"])

METHOD_JL_SAVED = "JL Wheel Method"


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
            cursor.execute("SELECT MAX(draw_no) FROM lotto_drawings")
            latest_row = cursor.fetchone()
            target_draw_no = latest_row[0] if latest_row and latest_row[0] is not None else None

        if target_draw_no is None:
            conn.close()
            return []

        cursor.execute("SELECT * FROM lotto_drawings WHERE draw_no = ?", (target_draw_no,))
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return []

        by_method = {}
        for row in rows:
            row_dict = dict(row)
            m = row_dict["method"]
            base_m = m.replace(" (Fallback)", "") if m else "기본"
            if base_m not in by_method:
                by_method[base_m] = []
            by_method[base_m].append(row_dict)

        for m in by_method:
            random.shuffle(by_method[m])

        recommended = []
        methods = list(by_method.keys())

        for m in methods:
            if by_method[m]:
                recommended.append(by_method[m].pop())

        remaining_pool = []
        for m in by_method:
            remaining_pool.extend(by_method[m])

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


@router.get("/api/analysis/generate/ai", response_model=List[dict])
def generate_ai_drawings():
    try:
        results = generate_random_sets(count=20)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/analysis/generate/wheel", response_model=List[dict])
def generate_wheel_drawings(
    count: int = Query(20, ge=1, le=20, description="1~20세트 (JL 프로파일 개수)"),
    draw_no: Optional[int] = Query(
        None,
        description="기준 회차(미지정 시 당첨 DB 최대+1)",
    ),
    seed: Optional[int] = Query(None, description="지정 시 재현 가능한 난수 시드"),
):
    """JL 휠: 누적 TOP6 시작 + 세트별 고정 속도 프로파일. DB 미저장."""
    try:
        import random as _random

        if seed is not None:
            _random.seed(seed)
        return generate_wheel_sets(count=count, start_index=0, draw_no=draw_no)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/analysis/generate-and-save", response_model=List[dict])
def generate_and_save_drawings(request: GenerateSaveRequest):
    """JL 휠 20세트 생성 후 해당 회차로 DB 저장."""
    try:
        draw_no = int(request.draw_no)
        rows = generate_jl_wheel_sets(draw_no, count=20, start_index=0)
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.DELETE_DRAWINGS_BY_NO_AND_METHOD, (draw_no, METHOD_JL_SAVED))
        out: List[dict] = []
        for r in rows:
            cursor.execute(
                queries.INSERT_DRAWING,
                (
                    f"jl_{uuid.uuid4().hex[:12]}",
                    int(r["num1"]),
                    int(r["num2"]),
                    int(r["num3"]),
                    int(r["num4"]),
                    int(r["num5"]),
                    int(r["num6"]),
                    0,
                    0,
                    METHOD_JL_SAVED,
                    draw_no,
                ),
            )
            out.append(
                {
                    "num1": r["num1"],
                    "num2": r["num2"],
                    "num3": r["num3"],
                    "num4": r["num4"],
                    "num5": r["num5"],
                    "num6": r["num6"],
                    "method": METHOD_JL_SAVED,
                }
            )
        conn.commit()
        conn.close()
        return out
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/analysis/draw-duplicate-insight")
def get_draw_duplicate_insight(
    draw_no: int = Query(..., ge=1, description="분석 대상 회차"),
    count: int = Query(20, ge=1, le=20, description="생성 세트 수"),
):
    """특정 회차의 교체 전/후 중복 세트와 당첨 세트 번호를 분석."""
    try:
        return analyze_draw_duplicate_sets(draw_no=draw_no, count=count)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
