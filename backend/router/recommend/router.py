import uuid
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from backend.domain.models.schemas import GenerateSaveRequest
from backend.router.recommend.helpers import (
    NUMBER_KEYS,
    build_number_counts,
    pick_least_frequent_number,
    pick_top_number,
    replace_excluded_in_rows,
)
from backend.router.recommend.jl_loader import load_jl_service
from backend.router.recommend.repository import (
    WINDOW_SIZES,
    fetch_rows_by_window,
    get_drawings_by_draw_no_and_method,
    replace_drawings_for_method,
    resolve_target_draw_no,
)

router = APIRouter(tags=["recommend"])

METHOD_JL_SAVED = "JL Wheel Method"


@router.get("/api/recommend/exclusion-candidates", response_model=dict)
def get_exclusion_candidates(
    draw_no: Optional[int] = Query(None, ge=1, description="추천 대상 회차(미지정 시 최신 당첨회차+1)"),
):
    try:
        target_draw_no = resolve_target_draw_no(draw_no)
        rows_by_window = fetch_rows_by_window(target_draw_no)

        overall_counts = build_number_counts(rows_by_window["overall"])
        least_frequent_overall = pick_least_frequent_number(overall_counts)

        window_top_numbers: Dict[str, dict] = {}
        for window_name in WINDOW_SIZES.keys():
            counts = build_number_counts(rows_by_window[window_name])
            window_top_numbers[window_name] = pick_top_number(counts)

        excluded_numbers_union = sorted(
            {
                info["number"]
                for info in window_top_numbers.values()
            }
        )

        return {
            "drawNo": target_draw_no,
            "leastFrequentOverall": least_frequent_overall,
            "windowTopNumbers": window_top_numbers,
            "excludedNumbersUnion": excluded_numbers_union,
            "drawCounts": {window_name: len(rows) for window_name, rows in rows_by_window.items()},
            "ruleMeta": {
                "topTiePolicy": "min-number-on-tie",
                "leastTiePolicy": "min-number-on-tie",
                "countedFields": list(NUMBER_KEYS),
            },
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/recommend/generate/wheel", response_model=List[dict])
def generate_wheel_drawings(
    count: int = Query(20, ge=1, le=20, description="1~20세트 (JL 프로파일 개수)"),
    draw_no: Optional[int] = Query(None, description="기준 회차(미지정 시 당첨 DB 최대+1)"),
    seed: Optional[int] = Query(None, description="지정 시 재현 가능한 난수 시드"),
):
    try:
        import random as _random

        _, _, generate_wheel_sets = load_jl_service()
        if seed is not None:
            _random.seed(seed)
        return generate_wheel_sets(count=count, start_index=0, draw_no=draw_no)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/recommend/generate-and-save", response_model=List[dict])
def generate_and_save_drawings(request: GenerateSaveRequest):
    try:
        draw_no = int(request.draw_no)
        applied_rule_ids = request.applied_rule_ids or []
        excluded_numbers = sorted(set(request.excluded_numbers or []))

        # 프론트엔드에서 세트를 직접 전달한 경우 그대로 사용, 없으면 기존 방식으로 생성
        if request.sets:
            rows = [
                {
                    "num1": s.num1,
                    "num2": s.num2,
                    "num3": s.num3,
                    "num4": s.num4,
                    "num5": s.num5,
                    "num6": s.num6,
                    "strategy": s.strategy,
                }
                for s in request.sets
            ]
        else:
            _, generate_jl_wheel_sets, _ = load_jl_service()
            excluded_set = set(excluded_numbers)
            rows = replace_excluded_in_rows(
                generate_jl_wheel_sets(draw_no, count=20, start_index=0),
                excluded_set,
            )

        replace_drawings_for_method(
            draw_no=draw_no,
            method=METHOD_JL_SAVED,
            rows=rows,
            id_factory=lambda: f"jl_{uuid.uuid4().hex[:12]}",
        )

        out: List[dict] = []
        for row in rows:
            out.append(
                {
                    "num1": row["num1"],
                    "num2": row["num2"],
                    "num3": row["num3"],
                    "num4": row["num4"],
                    "num5": row["num5"],
                    "num6": row["num6"],
                    "method": METHOD_JL_SAVED,
                    "strategy": row.get("strategy"),
                    "applied_rule_ids": applied_rule_ids,
                    "excluded_numbers": excluded_numbers,
                }
            )
        return out
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/recommend/drawings", response_model=List[dict])
def get_drawings(
    draw_no: int = Query(..., ge=1, description="조회할 회차"),
):
    try:
        return get_drawings_by_draw_no_and_method(draw_no=draw_no, method=METHOD_JL_SAVED)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/recommend/draw-duplicate-insight")
def get_draw_duplicate_insight(
    draw_no: int = Query(..., ge=1, description="추천 대상 회차"),
    count: int = Query(20, ge=1, le=20, description="생성 세트 수"),
):
    try:
        analyze_draw_duplicate_sets, _, _ = load_jl_service()
        return analyze_draw_duplicate_sets(draw_no=draw_no, count=count)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

