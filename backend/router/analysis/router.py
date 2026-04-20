import uuid
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from backend.database import get_connection
from backend.models import GenerateSaveRequest
from backend.sql.analysis import queries

router = APIRouter(tags=["analysis"])

METHOD_JL_SAVED = "JL Wheel Method"


def _load_jl_service():
    try:
        from features.analysis.api.jl_service import (  # type: ignore
            analyze_draw_duplicate_sets,
            generate_jl_wheel_sets,
            generate_wheel_sets,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"JL service import failed: {exc}",
        ) from exc
    return analyze_draw_duplicate_sets, generate_jl_wheel_sets, generate_wheel_sets


@router.get("/api/analysis/generate/wheel", response_model=List[dict])
def generate_wheel_drawings(
    count: int = Query(20, ge=1, le=20, description="1~20세트 (JL 프로파일 개수)"),
    draw_no: Optional[int] = Query(None, description="기준 회차(미지정 시 당첨 DB 최대+1)"),
    seed: Optional[int] = Query(None, description="지정 시 재현 가능한 난수 시드"),
):
    try:
        import random as _random

        _, _, generate_wheel_sets = _load_jl_service()
        if seed is not None:
            _random.seed(seed)
        return generate_wheel_sets(count=count, start_index=0, draw_no=draw_no)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/analysis/generate-and-save", response_model=List[dict])
def generate_and_save_drawings(request: GenerateSaveRequest):
    try:
        _, generate_jl_wheel_sets, _ = _load_jl_service()
        draw_no = int(request.draw_no)
        rows = generate_jl_wheel_sets(draw_no, count=20, start_index=0)
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.DELETE_DRAWINGS_BY_NO_AND_METHOD, (draw_no, METHOD_JL_SAVED))
        out: List[dict] = []
        for row in rows:
            cursor.execute(
                queries.INSERT_DRAWING,
                (
                    f"jl_{uuid.uuid4().hex[:12]}",
                    int(row["num1"]),
                    int(row["num2"]),
                    int(row["num3"]),
                    int(row["num4"]),
                    int(row["num5"]),
                    int(row["num6"]),
                    0,
                    0,
                    METHOD_JL_SAVED,
                    draw_no,
                ),
            )
            out.append(
                {
                    "num1": row["num1"],
                    "num2": row["num2"],
                    "num3": row["num3"],
                    "num4": row["num4"],
                    "num5": row["num5"],
                    "num6": row["num6"],
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
    try:
        analyze_draw_duplicate_sets, _, _ = _load_jl_service()
        return analyze_draw_duplicate_sets(draw_no=draw_no, count=count)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
